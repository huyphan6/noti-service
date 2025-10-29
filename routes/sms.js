// route that handles SMS sending logic
import express from "express";
import twilio from "twilio";
// import admin from "firebase-admin";
import app from "../firebaseConfig.js";
// import serviceAccount from "../serviceAccountKey.json" assert { type: "json" };
import {
    getFirestore,
    doc,
    collection,
    setDoc,
    getDocs,
    where,
    limit,
    query,
} from "firebase/firestore";
import "dotenv/config";
import crypto from "crypto";

const router = express.Router();
const db = getFirestore(app);

router.post("/", async (request, response) => {
    try {
        // Authenticate using API key from request headers
        if (request.headers.apikey !== process.env.API_KEY) {
            return response
                .status(401)
                .send({ message: "Unauthorized", success: false });
        }

        const accountSid = process.env.TWILIO_ACCOUNT_SID;
        const authToken = process.env.TWILIO_AUTH_TOKEN;
        const client = twilio(accountSid, authToken);

        const customers = request.body.customers;
        const surveyLink = process.env.SURVEY_LINK;
        const orderRef = collection(db, "orders");

        // Data Validation
        // Customer array is required
        if (!request.body.customers || !Array.isArray(request.body.customers)) {
            return response.status(400).send({
                message: "Invalid request: customers array is required",
                success: false,
            });
        }

        // At least one customer is required
        if (request.body.customers.length == 0) {
            return response.status(400).send({
                message: "Invalid request: at least one customer is required",
                success: false,
            });
        }

        // Customer Data Requires a Name, Phone Number, and Order
        for (const customer of request.body.customers) {
            const { name, phoneNumber, orderNumber, date } = customer;
            if (!name || !phoneNumber || !orderNumber || !date) {
                return response.status(400).send({
                    message:
                        "Each customer must have name, phoneNumber, orderNumber, and date fields",
                    success: false,
                });
            }

            // Phone Number Validation
            if (!phoneNumber.match(/^\+1\d{10}$/)) {
                return response.status(400).send({
                    message: `Invalid phone number for ${name}. Must be in format: +1XXXXXXXXXX`,
                    success: false,
                });
            }
        }

        const tasks = customers.map(async (customer) => {
            const { name, phoneNumber, orderNumber, date } = customer;

            // Check if customer opted out of messages
            const optOutQuery = query(
                collection(db, "optOuts"),
                where("phoneNumber", "==", phoneNumber),
                limit(1)
            );

            const optOutSnapshot = await getDocs(optOutQuery);

            if (!optOutSnapshot.empty) {
                console.log(`${phoneNumber} has opted out — skipping.`);
                return { customer, status: "skipped", reason: "opted out" };
            }

            // Create idempotency key based on phoneNumber, orderNumber, and date
            const idempotencyKey = crypto
                .createHash("sha256")
                .update(`${phoneNumber}-${orderNumber}-${date}`)
                .digest("hex");

            // Check if message with this idempotency key was already sent
            const existingOrderQuery = query(
                orderRef,
                where("idempotencyKey", "==", idempotencyKey),
                limit(1)
            );
            const existingOrderSnapshot = await getDocs(existingOrderQuery);

            if (!existingOrderSnapshot.empty) {
                console.log(
                    `Message to ${phoneNumber} for order ${orderNumber} on ${date} was already sent — skipping.`
                );
                return {
                    customer,
                    status: "skipped",
                    reason: "duplicate message",
                };
            }

            // Store order message record in Firestore
            await setDoc(doc(orderRef), {
                name: name,
                phoneNumber: phoneNumber,
                orderNumber: orderNumber,
                date: date,
                route: "/sms",
                expectingReply: false,
                idempotencyKey: idempotencyKey,
                status: "sent",
                sentAt: new Date().toISOString(),
            });

            const messageBody = `Winn Cleaners: Hi ${name}, your order #${orderNumber} is ready for pickup!\n\nQuestions? Call (617) 523-6860 or visit https://www.winncleaners.com/ \n\nWe'd love your feedback: ${surveyLink}\n\nThank you for choosing Winn Cleaners!\n\nReply STOP to unsubscribe\nReply START to re-subscribe`;

            // Send SMS via Twilio
            await client.messages.create({
                to: phoneNumber,
                from: process.env.TWILIO_PHONE_NUMBER,
                body: messageBody,
            });

            return { customer, status: "sent" };
        });

        const results = await Promise.all(tasks);

        // Aggregate message statistics
        const totalMessagesSent = results.filter((r) => r.status === "sent");
        const skippedMessages = results.filter((r) => r.status === "skipped");

        const summary = {
            totalMessagesSent: totalMessagesSent.length,
            totalMessagesSkipped: skippedMessages.length,
            skippedMessagesDetails: skippedMessages,
        };

        response.status(200).send({
            message: summary,
            success: totalMessagesSent.length > 0,
        });
    } catch (error) {
        console.log(error);
        response.status(500).send(error);
    }
});

export default router;

// route that handles SMS sending logic
import express from "express";
import twilio from "twilio";
import app from "../firebaseConfig.js";
import {
    getFirestore,
    doc,
    collection,
    setDoc,
    deleteDoc,
    query,
    where,
    getDocs,
} from "firebase/firestore";
import "dotenv/config";

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
        const orderRef = collection(db, "reminders");

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
            const { name, phoneNumber, orderNumber, initialPickupDate } =
                customer;
            if (!name || !phoneNumber || !orderNumber || !initialPickupDate) {
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
            const { name, phoneNumber, orderNumber, initialPickupDate } =
                customer;
            // data to track reminders + expiration dates
            const reminderSentDate = new Date();
            const expirationDate = new Date(reminderSentDate);
            expirationDate.setDate(expirationDate.getDate() + 30);

            await setDoc(doc(orderRef), {
                name: name,
                phoneNumber: phoneNumber,
                orderNumber: orderNumber,
                initialPickupDate: initialPickupDate,
                reminderSentDate: reminderSentDate.toISOString(),
                expirationDate: expirationDate.toISOString(),
                status: "reminded",
                lastUpdated: reminderSentDate.toISOString(),
                acknowledgement: "PENDING",
                sentFromRoute: "/reminders",
                expectingReply: true
            });

            const messageBody = `Winn Cleaners: Hi ${name}, you have an outstanding order #${orderNumber} from ${initialPickupDate}.\n\nOrders unclaimed after 90 days may be donated. Please pick up within 30 days.\n\nReply "YES" to confirm you will pick up within 30 days.\nReply "NO" to have us donate your order.\n\nMore info: https://www.winncleaners.com/policy\n\nReply STOP to unsubscribe\nReply START to re-subscribe`;

            return client.messages.create({
                to: phoneNumber,
                from: process.env.TWILIO_PHONE_NUMBER,
                body: messageBody,
            });
        });

        const totalMessages = await Promise.all(tasks);

        response.status(200).send({
            message:
                customers.length === 1
                    ? `Message sent successfully`
                    : `${totalMessages.length} Messages sent successfully`,
            success: true,
        });
    } catch (error) {
        console.log(error);
        return response.status(500).send(error);
    }
});

router.delete("/:orderNumber", async (request, response) => {
    try {
        // Authenticate using API key from request headers
        if (request.headers.apikey !== process.env.API_KEY) {
            return response
                .status(401)
                .send({ message: "Unauthorized", success: false });
        }

        const orderRemindersRef = collection(db, "reminders");
        const { orderNumber } = request.params;
        const customer = request.body.customer;

        const reminderDocumentQuery = query(
            orderRemindersRef,
            where("orderNumber", "==", orderNumber),
            where("phoneNumber", "==", customer.phoneNumber)
        );

        // Get all matching docs
        const reminderDocSnapshot = await getDocs(reminderDocumentQuery);

        // Check if there are any matching documents
        if (reminderDocSnapshot.empty) {
            return response
                .status(404)
                .send({ message: "No reminder found", success: false });
        }

        const deletePromises = [];
        reminderDocSnapshot.forEach((doc) => {
            deletePromises.push(deleteDoc(doc.ref));
        });

        await Promise.all(deletePromises);

        response.status(200).send({
            message: "Reminder Deleted Successfully",
            success: true,
        });
    } catch (error) {
        console.log(error);
        return response.status(500).send(error);
    }
});

export default router;

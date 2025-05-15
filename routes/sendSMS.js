// route that handles SMS sending logic
import express from "express";
import twilio from "twilio";
// import admin from "firebase-admin";
import app from "../firebaseConfig.js";
// import serviceAccount from "../serviceAccountKey.json" assert { type: "json" };
import { getFirestore, doc, collection, setDoc } from "firebase/firestore";
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
                    message: "Each customer must have name, phoneNumber, orderNumber, and date fields",
                    success: false
                    });
            }
            
            // Phone Number Validation
            if (!phoneNumber.match(/^\+1\d{10}$/)) {
                return response.status(400).send({
                    message: `Invalid phone number for ${name}. Must be in format: +1XXXXXXXXXX`,
                    success: false
                });
            }
        }

        const tasks = customers.map(async (customer) => {
            const { name, phoneNumber, orderNumber, date } = customer;

            await setDoc(doc(orderRef), {
                name: name,
                phoneNumber: phoneNumber,
                orderNumber: orderNumber,
                date: date,
            });

            const messageBody = `Winn Cleaners: Hi ${name}, your order #${orderNumber} is ready for pickup!\n\nQuestions? Call (617) 523-6860 or visit https://www.winncleaners.com/ \n\nWe'd love your feedback: ${surveyLink}\n\nThank you for choosing Winn Cleaners!`;

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
        response.status(500).send(error);
    }
});

export default router;

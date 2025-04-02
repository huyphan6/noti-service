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
        const accountSid = request.body.accountSid;
        const authToken = request.body.authToken;
        const client = twilio(accountSid, authToken);
        const customers = request.body.customers;
        const surveyLink = process.env.SURVEY_LINK;
        const orderRef = collection(db, "orders");

        const tasks = customers.map(async (customer) => {
            const { name, phoneNumber, orderNumber, date } = customer;

            await setDoc(doc(orderRef), {
                name: name,
                phoneNumber: phoneNumber,
                orderNumber: orderNumber,
                date: date,
            });

            const messageBody = `Winn Cleaners: Hello ${name},\n\nYour order #${orderNumber} is ready for pickup! Please call us @ (617) 523-6860 or visit https://www.winncleaners.com/ with any questions or concerns.\n\nYour satisfaction is important to us. Would you mind taking a moment to share your feedback? We value your input! Click here ${surveyLink} to complete a short survey.\n\nThank you for choosing Winn Cleaners!`;

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

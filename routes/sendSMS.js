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

// const accountSid = process.env.TWILIO_ACCOUNT_SID;
// const authToken = process.env.TWILIO_AUTH_TOKEN;
// const client = twilio(accountSid, authToken);

router.post("/", async (request, response) => {
    try {
        const accountSid = request.body.accountSid;
        const authToken = request.body.authToken;
        const client = twilio(accountSid, authToken);
        const customers = request.body.customers;

        const orderRef = collection(db, "orders");
        customers.map(async (customer) => {
            const name = customer.name;
            const phoneNumber = customer.phoneNumber;
            const orderNumber = customer.orderNumber;
            const date = customer.date;

            await setDoc(doc(orderRef), {
                name: name,
                phoneNumber: phoneNumber,
                orderNumber: orderNumber,
                date: date,
            });

            const messageBody = `Winn Cleaners: Hello ${name},\n\nYour order #${orderNumber} is ready for pickup! Please call us @ (617) 523-6860 or visit https://www.winncleaners.com/ with any questions or concerns.\n\nThank you!`;

            client.messages
                .create({
                    to: phoneNumber,
                    from: process.env.TWILIO_PHONE_NUMBER,
                    body: messageBody,
                })
                .then((message) => {
                    console.log(message);
                });

            response
                .status(200)
                .send({
                    message:
                        messages.length === 1
                            ? `Message sent successfully`
                            : `${messages.length} Messages sent successfully`,
                    success: true,
                });
        });
    } catch (error) {
        console.log(error);
        response.status(500).send(error);
    }
});

export default router;

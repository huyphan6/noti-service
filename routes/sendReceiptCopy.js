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

        const orderForm = request.body.orderForm;
        const phoneNumber = orderForm.phoneNumber;
        const customerName = orderForm.customerName;
        const formattedPhoneNumber = `+1${phoneNumber}`;

        const messageBody = `Winn Cleaners: Hello ${customerName}! \n\n Your order receipt is attached. Thank you for choosing Winn! \n\n ${JSON.stringify(
            orderForm,
            null,
            4
        )}`;

        const twilioResponse = await client.messages.create({
            to: formattedPhoneNumber,
            from: process.env.TWILIO_PHONE_NUMBER,
            body: messageBody,
        });

        response.status(200).send({
            message: `Message sent successfully`,
            sid: twilioResponse.sid,
            success: true,
        });
    } catch (error) {
        console.log(error);
        response.status(500).send(error);
    }
});

export default router;

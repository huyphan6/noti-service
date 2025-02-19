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
        const dateRange = request.body.dateRange
        const client = twilio(accountSid, authToken);

        const logs = await client.messages.list({
            dateSentAfter: dateRange[0],
            dateSentBefore: dateRange[1],
        });

        response.status(200).send(logs);
    } catch (error) {
        console.log(error);
        response.status(500).send(error);
    }
});

export default router;

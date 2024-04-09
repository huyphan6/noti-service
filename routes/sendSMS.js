// route that handles SMS sending logic
import express from "express";
import twilio from "twilio";
import "dotenv/config";
import res from "express/lib/response";
const router = express.Router();

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = twilio(accountSid, authToken);

router.post("/", async (request, response) => {
    try {
        client.messages
            .create({
                body: "Test message from Twilio! -Huy Phan 🚀",
                from: "+18445491291",
                to: "+16174330481",
            })
            .then((message) => console.log(message.sid));
    } catch (error) {
        console.log(error);
        response.status(500).send(error);
    }
});

export default router;

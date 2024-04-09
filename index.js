import express from "express";
import twilio from "twilio";
import "dotenv/config";
const app = express();

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = twilio(accountSid, authToken);

client.messages
    .create({
        body: "Test message from Twilio! -Huy Phan🚀",
        from: "+18445491291",
        to: "+16174330481",
    })
    .then((message) => console.log(message.sid));

app.listen(8000, () => {
    console.log("Server is running on port 8000");
});

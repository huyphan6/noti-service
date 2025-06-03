import express from "express";
import twilio from "twilio";
import bodyParser from "body-parser";
import cors from "cors";
import "dotenv/config";

// Route imports
import sms from "../routes/sms.js";
import logs from "../routes/logs.js";
import receipt from "../routes/receipt.js";
import reminders from "../routes/reminders.js";

// Webhook import
import inboundMessageWebhook from "../webhooks/inboundMessageWebhook.js"

// Firebase imports here

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.json());
app.use(cors());
app.use("/sms", sms);
app.use("/logs", logs)
app.use("/receipt", receipt);
app.use("/reminders", reminders);
app.use("/inboundMessageWebhook", inboundMessageWebhook)

app.get("/", (req, res) => {
    res.send("Hey this is my API running 🥳");
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

export default app;

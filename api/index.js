import express from "express";
import twilio from "twilio";
import bodyParser from "body-parser";
import "dotenv/config";

// Route imports
import sendSMS from "../routes/sendSMS.js";
import getLogs from "../routes/getLogs.js"

// Firebase imports here

const app = express();
app.use(bodyParser.json());
app.use("/sendSMS", sendSMS);
app.use("/getLogs", getLogs)

app.get("/", (req, res) => {
    res.send("Hey this is my API running 🥳");
});

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

export default app;

import express from "express";
import twilio from "twilio";
import bodyParser from "body-parser";
import "dotenv/config";

// Route imports
import sendSMS from "./routes/sendSMS.js";
import saveOrder from "./routes/saveOrder.js";
import parseData from "./routes/parseData.js";

// Firebase imports here

const app = express();
app.use(bodyParser.json());
app.use("/sendSMS", sendSMS);
app.use("/saveOrder", saveOrder);
app.use("/parseData", parseData);

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

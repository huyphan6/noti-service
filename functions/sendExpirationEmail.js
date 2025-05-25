import nodemailer from "nodemailer";
import "dotenv/config";
import createHTMLTable from "./createHTMLTable.js";

const sendExpirationEmail = async (data) => {
    try {
        // Create transporter object to send email
        const transporter = nodemailer.createTransport({
            service: "gmail",
            host: 465,
            auth: {
                user: process.env.USER_EMAIL,
                pass: process.env.GOOGLE_APP_PASSWORD,
            },
        });

        // This function verifies SMTP Config
        transporter.verify((error, success) => {
            if (error) {
                console.error(error);
                return false;
            } else {
                console.log(success, "Server is ready to take our messages");
            }
        });

        const HTMLData = createHTMLTable(data)

        const message = {
            from: process.env.USER_EMAIL,
            to: process.env.USER_EMAIL,
            subject: "Expired Orders",
            text: "Here's a list of all the expired orders: ",
            html: HTMLData,
        };

        const info = await transporter.sendMail(message);
        info.messageId
            ? console.log(`Message Sent Successfully`)
            : console.log(`Message Failed to Send`);
        return true;
    } catch (error) {
        console.log(error);
        return false;
    }
};

export default sendExpirationEmail;

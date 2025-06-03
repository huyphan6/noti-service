import express from "express";
import twilio from "twilio";
import MessagingResponse from "twilio/lib/twiml/MessagingResponse.js";
import app from "../firebaseConfig.js";
import {
    getFirestore,
    doc,
    getDocs,
    setDoc,
    collection,
    updateDoc,
    query,
    where,
} from "firebase/firestore";
import "dotenv/config";

const router = express.Router();
const db = getFirestore(app);
const orderRemindersRef = collection(db, "reminders");

router.post("/", async (request, response) => {
    try {
        const today = new Date();
        const twiml = new MessagingResponse();

        // Get the sender's phone number and the message body
        const fromNumber = request.body.From;
        const incomingMsg = request.body.Body ? request.body.Body.trim() : "";

        // Check for missing required fields
        if (!fromNumber || !incomingMsg) {
            console.log(
                "400 - Missing phone number or message text in request."
            );
            const twiml = new MessagingResponse();
            twiml.message(
                "Missing phone number or message text in request. Please try again."
            );
            return response.type("text/xml").status(200).send(twiml.toString());
        }

        // Handle and Store Opted Out Users
        const optOutKeywords = ["stop", "unsubscribe", "cancel", "end", "quit"];
        if (optOutKeywords.includes(incomingMsg.toLowerCase())) {
            console.log(`${fromNumber} has opted out.`);

            await setDoc(doc(db, "optOuts", fromNumber), {
                phoneNumber: fromNumber,
                optedOutAt: new Date(),
                optedOut: true,
            });

            twiml.message("You have been unsubscribed. Thank you!");
            return response.type("text/xml").status(200).send(twiml.toString());
        }

        // Handle Order Reminder Acknowledgement
        else if (incomingMsg.toUpperCase() === "YES") {
            console.log(
                `${fromNumber} has acknowledged and will pickup their order within 30 days`
            );

            const expiredOrderQuery = query(
                orderRemindersRef,
                where("phoneNumber", "==", fromNumber)
            );
            const expiredOrderSnapshot = await getDocs(expiredOrderQuery);

            if (!expiredOrderSnapshot.empty) {
                const updatePromises = [];

                expiredOrderSnapshot.forEach((doc) => {
                    updatePromises.push(
                        updateDoc(doc.ref, {
                            acknowledgement: "PICKUP",
                            lastUpdated: today.toISOString(),
                        })
                    );
                });

                await Promise.all(updatePromises);

                twiml.message("Reponse Received. You have acknowledged to pickup your order within 30 days. Thank You!");
                response.type("text/xml").status(200).send(twiml.toString());
            } else {
                console.log("404 - Phone number not found");
                twiml.message(
                    "Oops! This record was not found. Please Try Again."
                );

                response.type("text/xml").status(200).send(twiml.toString());
            }
        } else if (incomingMsg.toUpperCase() === "NO") {
            console.log(
                `${fromNumber} has acknowledged and wants the items donated`
            );

            const expiredOrderQuery = query(
                orderRemindersRef,
                where("phoneNumber", "==", fromNumber)
            );
            const expiredOrderSnapshot = await getDocs(expiredOrderQuery);

            if (!expiredOrderSnapshot.empty) {
                const updatePromises = [];

                expiredOrderSnapshot.forEach((doc) => {
                    updatePromises.push(
                        updateDoc(doc.ref, {
                            acknowledgement: "DONATE",
                            lastUpdated: today.toISOString(),
                        })
                    );
                });

                await Promise.all(updatePromises);

                twiml.message("Response Received. You have acknowledged that you want your order donated. Thank You!");
                response.type("text/xml").status(200).send(twiml.toString());
            } else {
                console.log("404 - Phone number not found");
                twiml.message(
                    "Oops! This record was not found. Please try again."
                );

                response.type("text/xml").status(200).send(twiml.toString());
            }
        } else {
            console.log("400 - Bad Input. Response not accepted. Please reply with YES, NO, or STOP.");
            twiml.message("Sorry, your response was not accepted. Please reply with YES, NO, or STOP.");

            response.type("text/xml").status(200).send(twiml.toString());
        }
    } catch (e) {
        console.log(e);
        console.log("500 - Internal Server Error. Try Again");

        const twiml = new MessagingResponse();
        twiml.message(
            "Oops! There was an error. Please check your response and try again!"
        );
        response.type("text/xml").status(200).send(twiml.toString());
    }
});

export default router;

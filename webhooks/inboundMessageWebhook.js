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
        const incomingMsg = request.body.Body;

        // Check for missing required fields
        if (!fromNumber || !incomingMsg || !incomingMsg.trim()) {
            console.log("Missing phone number or message text in request.");
            const twiml = new MessagingResponse();
            twiml.message(
                "Missing phone number or message text in request. Please try again."
            );
            return response.type("text/xml").status(400).send(twiml.toString());
        }

        // Handle and Store Opted Out Users
        const optOutKeywords = ["stop", "unsubscribe", "cancel", "end", "quit"];
        if (optOutKeywords.includes(incomingMsg.trim().toLowerCase())) {
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
        else if (incomingMsg.trim().toUpperCase() === "YES") {
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

                twiml.message("Reponse Received. Thank You!");
                response.type("text/xml").status(200).send(twiml.toString());
            } else {
                console.log("Phone number not found");
                twiml.message(
                    "Oops! This record was not found. Please Try Again."
                );

                response.type("text/xml").status(404).send(twiml.toString());
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

                twiml.message("Reponse Received. Thank You!");
                response.type("text/xml").status(200).send(twiml.toString());
            } else {
                console.log("Phone number not found");
                twiml.message(
                    "Oops! This record was not found. Please try again."
                );

                response.type("text/xml").status(404).send(twiml.toString());
            }
        } else {
            twiml.message("Sorry that response is not accepted");

            response.type("text/xml").status(400).send(twiml.toString());
        }
    } catch (e) {
        console.log(e);

        const twiml = new MessagingResponse();
        twiml.message(
            "Oops! There was an error. Please check your response and try again!"
        );
        response.type("text/xml").status(500).send(twiml.toString());
    }
});

export default router;

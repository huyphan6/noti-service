import {
    getFirestore,
    collection,
    query,
    where,
    getDocs,
    updateDoc,
} from "firebase/firestore";
import app from "../../firebaseConfig.js";

import sendExpirationEmail from "../../functions/sendExpirationEmail.js";

const handler = async (req, res) => {
    // Authenticate using Vercel's cron headers
    // Vercel includes these headers when triggering cron jobs
    const isVercelCron =
        req.headers["user-agent"]?.includes("vercel-cron") ||
        req.headers["x-vercel-cron"];

    if (!isVercelCron) {
        return res
            .status(401)
            .json({ message: "Unauthorized", success: false });
    }

    try {
        const db = getFirestore(app);
        const orderRemindersRef = collection(db, "reminders");
        const today = new Date();

        console.log("Starting expired orders check:", today.toISOString());

        // Query for orders that have expired (30+ days after reminder)
        const expiredOrdersQuery = query(
            orderRemindersRef,
            where("expirationDate", "<", today.toISOString()),
            where("status", "==", "reminded")
        );

        const expiredOrdersSnapshot = await getDocs(expiredOrdersQuery);

        // If no expired orders, return early
        if (expiredOrdersSnapshot.empty) {
            console.log("No expired orders found");
            return res.status(200).json({ message: "No expired orders found" });
        }

        // Process expired orders
        const expiredItems = [];
        const updatePromises = [];

        expiredOrdersSnapshot.forEach((doc) => {
            const data = doc.data();
            expiredItems.push(data);

            // Update status to expired (collect promises to execute in parallel)
            updatePromises.push(
                updateDoc(doc.ref, {
                    status: "expired",
                    lastUpdated: today.toISOString(),
                })
            );
        });

        // Execute all updates in parallel
        await Promise.all(updatePromises);
        console.log(`Found ${expiredItems.length} expired orders`);

        // Send notification email to owner
        if (expiredItems.length > 0) {
            console.log(
                `Preparing to send an email for ${expiredItems.length} items`
            );

            try {
                const success = await sendExpirationEmail(expiredItems);
                if (success) {
                    return res.status(200).json({
                        message: `Processed ${expiredItems.length} expired orders`,
                        expiredOrders: expiredItems,
                    });
                } else {
                    return res.status(500).json({
                        error: "There was an error sending the message",
                    });
                }
            } catch (error) {
                console.log(
                    `There was an error trying to send the email ${error}`
                );
                res.status(500).json({ error: error.message });
            }
        }
    } catch (error) {
        console.error("Error checking expired orders:", error);
        return res.status(500).json({ error: error.message });
    }
};

export default handler;

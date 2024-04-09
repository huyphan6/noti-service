// API route that send order details to database

import express from "express";
import "dotenv/config";
const router = express.Router();

router.post("/", async (request, response) => {
    try {
        
    } catch (error) {
        console.log(error);
        response.status(500).send(error);
    }
})

export default router;
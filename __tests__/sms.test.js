import request from "supertest";
import app from "../api/index.js";

describe("SMS API Endpoint", () => {
    test("POST /sendSMS", async () => {
        const res = await request(app)
            .post("/sendSMS")
            .send({
                accountSid: process.env.TWILIO_ACCOUNT_SID,
                authToken: process.env.TWILIO_AUTH_TOKEN,
                customers: [
                    {
                        name: "Huy P",
                        phoneNumber: "+16174330481",
                        orderNumber: "12345",
                        date: "04/16/20224",
                    },
                ],
            });

        // The response should have a status code of 200
        expect(res.statusCode).toBe(200);

        // The response should contain a message object and a success boolean
        expect(res.body).toHaveProperty("message");
        expect(res.body).toHaveProperty("success");
    });
});

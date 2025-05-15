import request from "supertest";
import app from "../api/index.js";

describe("Order Reminder Endpoint", () => {
    test("POST /sendReminder", async () => {
        const res = await request(app)
            .post("/sendReminder")
            .set('apikey', process.env.API_KEY)  // Add the API key to headers
            .send({
                customers: [
                    {
                        name: "Huy Phan",
                        phoneNumber: "+16174330481",
                        orderNumber: "0101",
                        date: "05/15/2024",
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

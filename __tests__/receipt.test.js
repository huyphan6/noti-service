import request from "supertest";
import app from "../api/index.js";

describe("Receipt Copy Endpoint", () => {
    test("POST /receipt", async () => {
        const res = await request(app)
            .post("/receipt")
            .send({
                accountSid: process.env.TWILIO_ACCOUNT_SID,
                authToken: process.env.TWILIO_AUTH_TOKEN,
                orderForm: {
                    orderID: "6097",
                    customerName: "HP",
                    phoneNumber: "6174330481",
                    datePlaced: "07/08/2024",
                    pickupDate: "07/15/2024",
                    status: "Processing",
                    totalPrice: 95,
                    shirtOptions: {
                        box: "5",
                        hanger: 0,
                        starch: "Light",
                        noStarch: 0,
                    },
                    items: {
                        shirts: "10",
                        trousers: "1",
                        suits: "1",
                        ties: "1",
                        washAndFold: "10",
                    },
                    alterations: {
                        hem: 0,
                        takeInOut: 0,
                        zipper: 0,
                        buttons: 0,
                        pocket: 0,
                        misc: 0,
                    },
                },
            });

        // The response should have a status code of 200
        expect(res.statusCode).toBe(200);

        // The response should contain a message object and a success boolean
        expect(res.body).toHaveProperty("message");
        expect(res.body).toHaveProperty("success");
    });
});

import request from "supertest";
import app from "../api/app.js";
import twilio from "twilio";
import handler from "../routes/sms.js";
import * as firestore from "firebase/firestore";
import crypto from "crypto";

import testEnv from "./functions/testEnv.js";

// * We need to patch each async op, e.g. twilio and firestore calls
// * define beforeEach() function similar to setUp() in python
// * create magic mocks with jest.fn(), we need to explicitly define nested attributes because jest.fn() creates empty objects
// * attach return values to mock function using jest.fn().mockReturnValue(value) or async returns with jest.fn().mockResolvedValue()

// store a copy of env vars
const ORIGINAL_ENV = process.env;

// * patch modules using jest.mock()
// * patch single functions using jest.spyOn()
// * mock fake data using jest.fn() == MagicMock()

// functions that run before and after each test
let server;

beforeEach(() => {
    process.env = { ...ORIGINAL_ENV };
    jest.resetModules();
    server = app.listen(8080);
});

afterEach((done) => {
    process.env = ORIGINAL_ENV;
    server.close(done);
});

describe("Authentication Pathways", () => {
    test("Authentication via API Key Success", async () => {
        // create a mock API KEY
        process.env.API_KEY = "test_api_key";

        // inject the mock API key in the request header
        const res = await request(app)
            .post("/sms")
            .set("apikey", "test_api_key")
            .send({
                customers: [
                    {
                        name: "Alice",
                        phoneNumber: "+14445556666",
                        orderNumber: "1234",
                        date: "11/18/2025",
                    },
                ],
            });

        expect(res.statusCode).toBe(200);
    });

    test("Authentication via API Key Failure", async () => {
        // create a mock API key
        process.env.API_KEY = "test_api_key";

        // inject a bad API key in the request header
        const res = await request(app)
            .post("/sms")
            .set("apikey", "bad_api_key")
            .send({
                customers: [],
            });

        expect(res.statusCode).toBe(401);
    });
});

describe("Environment Variable Validation Logic", () => {
    // Reset env vars before each test to test each throw independently
    beforeEach(() => {
        process.env.TWILIO_ACCOUNT_SID = "test_sid"
        process.env.TWILIO_AUTH_TOKEN = "test_auth_token"
        process.env.SURVEY_LINK = "test_survey_link"
    })

    test("Succeeds When All Env Vars Exist", () => {
        expect(() => testEnv()).not.toThrow()
    });
    test("Fails When Twilio Account Sid is Missing", () => {
        process.env.TWILIO_ACCOUNT_SID = ""
        expect(() => testEnv()).toThrow("Missing TWILIO_ACCOUNT_SID")
    })
    test("Fails When Twilio Auth Token is Missing", () => {
        process.env.TWILIO_AUTH_TOKEN = ""
        expect(() => testEnv()).toThrow("Missing TWILIO_AUTH_TOKEN")
    })
    test("Fails When Survey Link is Missing", () => {
        process.env.SURVEY_LINK = ""
        expect(() => testEnv()).toThrow("Missing SURVEY_LINK")
    })
});

describe("Twilio Client", () => {
    // TODO: test twilio client success
    // TODO: test twilio client failure
    // TODO: twilio message sending success (mock twilio client.messages.create)
    // TODO: twilio message sending failure
});

describe("Firebase Cloud Firestore Interactions", () => {});

// Add mocks at the top level so they are applied before imports

const mockCreate = jest.fn().mockResolvedValue({ sid: "test-message-sid" });
// const mockCreate = jest.fn(async () => ({ sid: "test-message-sid" }));
jest.mock("../lib/createTwilioClient.js", () => ({
    createTwilioClient: jest.fn(() => ({
        messages: {
            create: mockCreate,
        },
    })),
}));

jest.mock("firebase/firestore", () => ({
    getFirestore: jest.fn(() => ({})),
    collection: jest.fn(() => ({})),
    doc: jest.fn(() => ({})),
    addDoc: jest.fn().mockResolvedValue({ id: "fake-id" }),
    where: jest.fn(),
    limit: jest.fn(),
    query: jest.fn(),
    getDocs: jest.fn().mockResolvedValue({ docs: [] }),
    setDoc: jest.fn().mockResolvedValue(undefined),
}));

import request from "supertest";
import app from "../api/app.js";

import testEnv from "./functions/testEnv.js";
import { createTwilioClient } from "../lib/createTwilioClient.js";

// store a copy of env vars
const ORIGINAL_ENV = process.env;

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

describe("Authentication Validation", () => {
    test("Success: Authentication via API Key", async () => {
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
        
        // assert successful response
        expect(res.statusCode).toBe(200);
        expect(res.body.error).toBeUndefined();
    });

    test("Failure: Authentication via API Key", async () => {
        // create a mock API key
        process.env.API_KEY = "test_api_key";

        // inject a bad API key in the request header
        const res = await request(app)
            .post("/sms")
            .set("apikey", "bad_api_key")
            .send({
                customers: [],
            });
        
        // assert the correct error response message and status code
        expect(res.statusCode).toBe(401);
        expect(res.body.message).toBe("Unauthorized");
    });
});

describe("Environment Variable Validation Logic", () => {
    // Reset env vars before each test to test each throw independently
    beforeEach(() => {
        process.env.TWILIO_ACCOUNT_SID = "test_sid";
        process.env.TWILIO_AUTH_TOKEN = "test_auth_token";
        process.env.SURVEY_LINK = "test_survey_link";
    });

    test("Success: Environment Variables Exist", () => {
        expect(() => testEnv()).not.toThrow();
    });
    test("Failure: Twilio Account Sid is Missing", () => {
        process.env.TWILIO_ACCOUNT_SID = "";
        expect(() => testEnv()).toThrow("Missing TWILIO_ACCOUNT_SID");
    });
    test("Failure: Twilio Auth Token is Missing", () => {
        process.env.TWILIO_AUTH_TOKEN = "";
        expect(() => testEnv()).toThrow("Missing TWILIO_AUTH_TOKEN");
    });
    test("Failure: Survey Link is Missing", () => {
        process.env.SURVEY_LINK = "";
        expect(() => testEnv()).toThrow("Missing SURVEY_LINK");
    });
});

describe("Twilio Client Validation", () => {
    beforeEach(async () => {
        // Set test env
        process.env.TWILIO_ACCOUNT_SID = "test_sid";
        process.env.TWILIO_AUTH_TOKEN = "test_auth_token";
        process.env.API_KEY = "test_api_key";
    });

    test("Success: Twilio Client Init", async () => {
        console.log("Before request:", createTwilioClient.mock.calls.length);

        // Call the post route
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

        console.log("After request:", createTwilioClient.mock.calls.length);

        // assert twilio constructor called correctly
        expect(createTwilioClient).toHaveBeenCalledWith(
            "test_sid",
            "test_auth_token"
        );
        expect(res.status).toBe(200);
    });

    test("Failure: Twilio Client Init", async () => {
        // create a side effect of the mock to throw an error
        createTwilioClient.mockImplementation(() => {
            throw new Error("Twilio Init Failed");
        });

        // Call the post route
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

        // assert init failure with 500 status code
        expect(res.status).toBe(500);
    });
    // TODO: twilio message sending success (mock twilio client.messages.create)
    // TODO: twilio message sending failure
});

// describe("Firebase Cloud Firestore Interactions", () => {});

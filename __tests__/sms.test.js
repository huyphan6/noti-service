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
    getFirestore: jest.fn().mockReturnValue({ db: "fake-db" }),
    collection: jest.fn().mockReturnValue({ id: "fake-collection-ref" }),
    doc: jest.fn().mockReturnValue({ docRef: "fake-doc-ref" }),
    where: jest.fn().mockReturnValue({
        type: "where",
        field: "name",
        op: "==",
    }),
    limit: jest.fn().mockReturnValue({ type: "limit", count: 1 }),
    query: jest.fn().mockReturnValue({ type: "query", constraints: [] }),
    getDocs: jest.fn().mockResolvedValue({ docs: [], empty: false }),
    setDoc: jest.fn().mockResolvedValue(true),
    addDoc: jest.fn().mockResolvedValue({ id: "fake-id" }),
}));

import request from "supertest";
import app from "../api/app.js";

import testEnv from "./functions/testEnv.js";
import { createTwilioClient } from "../lib/createTwilioClient.js";
import {
    getFirestore,
    collection,
    doc,
    addDoc,
    where,
    limit,
    query,
    getDocs,
    setDoc,
} from "firebase/firestore";

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

    afterEach(() => {
        // Restore original implementation of the mock
        createTwilioClient.mockRestore();
    });

    test("Success: Twilio Client Init", async () => {
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

        // assert twilio constructor called correctly
        expect(createTwilioClient).toHaveBeenCalledWith(
            "test_sid",
            "test_auth_token"
        );
        expect(res.status).toBe(200);
    });

    test("Failure: Twilio Client Init", async () => {
        // create a side effect of the mock to throw an error
        // this is a function override which must be restored after the test
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

describe("Firebase Cloud Firestore Interactions", () => {
    beforeEach(async () => {
        // Set test env
        process.env.TWILIO_ACCOUNT_SID = "test_sid";
        process.env.TWILIO_AUTH_TOKEN = "test_auth_token";
        process.env.API_KEY = "test_api_key";

        // Restore return values before each test
        collection.mockReturnValue({ id: "fake-collection-ref" });
        where.mockReturnValue({ type: "where", field: "name", op: "==" });
        limit.mockReturnValue({ type: "limit", count: 1 });
    });

    afterEach(async () => {
        // Restore original implementations of the mocks
        query.mockRestore();
    })

    test("Success: Valid Order Collection Reference", async () => {
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

        // assert that the correct params were used to get the collection reference
        expect(collection).toHaveBeenCalledWith({ db: "fake-db" }, "orders");
        expect(collection).toHaveBeenCalledWith({ db: "fake-db" }, "optOuts");
        expect(res.status).toBe(200);
    });

    test("Failure: Invalid Order Collection Reference", async () => {
        // test behavior when collection returns invalid value
        // we can do this by overriding the return value to be undefined\
        collection.mockReturnValue(undefined);

        // query() should throw when bad input is passed
        query.mockImplementation(() => {
            throw new Error("Invalid collection reference");
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

        expect(res.status).toBe(500);
    });

    test("Success: Route Calls Query With Correct Params", async () => {
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

        // query takes a collectionRef, a where clause, and optional param limit
        // replace those values with the mocked ones defined above
        expect(query).toHaveBeenCalledWith(
            { id: "fake-collection-ref" },
            { type: "where", field: "name", op: "==" },
            { type: "limit", count: 1 }
        );
        expect(res.status).toBe(200);
    });

    test("Failure: Invalid Collection Param in Query Returns 500", async () => {
        // Override return values
        // Overridden values must be restored either before or after the test
        collection.mockReturnValueOnce(undefined);

        // query() should throw when bad input is passed
        query.mockImplementation(() => {
            throw new Error("Invalid collection reference");
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

        expect(res.status).toBe(500);
    });
    test("Failure: Invalid Where Param in Query Returns 500", async () => {
        // Override return values
        // Overridden values must be restored either before or after the test
        where.mockReturnValue(undefined)

        // query() should throw when bad input is passed
        query.mockImplementation(() => {
            throw new Error("Invalid collection reference");
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

        expect(res.status).toBe(500);
    });
    test("Failure: Invalid Limit Param in Query Returns 500", async () => {
        // Override return values
        // Overridden values must be restored either before or after the test
        limit.mockReturnValue(undefined)

        // query() should throw when bad input is passed
        query.mockImplementation(() => {
            throw new Error("Invalid collection reference");
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

        expect(res.status).toBe(500);
    });
});

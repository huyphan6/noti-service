import request from "supertest";
import app from "../api/app.js";
import twilio from "twilio";
import handler from "../routes/sms.js";

// !!! We need to patch each async op, e.g. twilio and firestore calls
// !!! define beforeEach() function similar to setUp() in python
// !!! create magic mocks with jest.fn(), we need to explicitly define nested attributes because jest.fn() creates empty objects
// !!! attach return values to mock function using jest.fn().mockReturnValue(value) or async returns with jest.fn().mockResolvedValue()

// store a copy of env vars
const ORIGINAL_ENV = process.env;

// TODO: patch dependecies using jest.mock() == @patch('')
jest.mock("twilio");
// TODO: mock fake data using jest.fn() == MagicMock()

// TODO: write setUp function to initialize common variables and mocks
let server;

beforeEach(() => {
    process.env = { ...ORIGINAL_ENV }
    jest.resetModules();
    server = app.listen(8080);
});

afterEach((done) => {
    process.env = { ...ORIGINAL_ENV };
    server.close(done);
});

describe("SMS POST Route", () => {
    // Define all tests here

    // TODO: test all async paths, both success and failure cases
    // TODO: test authentication header success
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
                        phoneNumber: "+13334445555",
                        orderNumber: "1234",
                        date: "11/18/2025",
                    },
                ],
            });
        
        expect(res.statusCode).toBe(200);
    });
    // TODO: test authentication header failure
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
    // TODO: test env var assignment success by injecting good env vars
    test("Environment Variable Assignment Success", async () => {
        // mock fake env vars
        process.env.TWILIO_ACCOUNT_SID = "test_sid";
        process.env.TWILIO_AUTH_TOKEN = "test_token";

        // check if env vars are assigned correctly
        expect(process.env.TWILIO_ACCOUNT_SID).toBe("test_sid");
        expect(process.env.TWILIO_AUTH_TOKEN).toBe("test_token");
    });
    // TODO: test env var assignment failure by injecting bad env vars
    // TODO: test twilio client success
    // TODO: test twilio client failure
    // TODO: twilio message sending success (mock twilio client.messages.create)
    // TODO: twilio message sending failure
});

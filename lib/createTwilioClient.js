import twilio from "twilio";

const createTwilioClient = (accountSid, authToken) => {
    return twilio(accountSid, authToken);
};

export { createTwilioClient };

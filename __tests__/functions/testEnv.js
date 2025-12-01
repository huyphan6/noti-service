import "dotenv/config"

const testEnv = () => {
    if (!process.env.TWILIO_ACCOUNT_SID) {
        throw new Error("Missing TWILIO_ACCOUNT_SID")
    }
    
    if (!process.env.TWILIO_AUTH_TOKEN) {
        throw new Error("Missing TWILIO_AUTH_TOKEN")
    }
    
    if (!process.env.SURVEY_LINK ) {
        throw new Error("Missing SURVEY_LINK")
    }
};

export default testEnv;
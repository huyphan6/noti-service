import "dotenv/config";
import readline from "readline";
import fetch from "node-fetch";

const API_KEY = process.env.API_KEY;
const ENDPOINT = "https://noti-service-mlmj.vercel.app/sms";

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

const prompt = (question) =>
    new Promise((resolve) => rl.question(question, resolve));

const parseArgs = () => {
    const args = process.argv.slice(2);

    if (args.includes("--help") || args.includes("-h")) {
        console.log(`
Usage:
  node send-alert.js                    # Interactive mode
  node send-alert.js --name "John" --phone "+16175551234" --order "12345" --date "04/15/2025"

Options:
  --name     Customer name
  --phone    Phone number (e.g., +16175551234 or 6175551234)
  --order    Order number
  --date     Date in MM/DD/YYYY format
  --help     Show this help message
`);
        process.exit(0);
    }

    const flags = {};
    for (let i = 0; i < args.length; i += 2) {
        if (args[i].startsWith("--")) {
            flags[args[i].substring(2)] = args[i + 1];
        }
    }
    return flags;
};

const formatDate = (dateStr) => {
    const match = dateStr.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (!match) {
        throw new Error("Date must be in MM/DD/YYYY format");
    }
    const [, month, day, year] = match;
    return `${year}/${month}/${day}`;
};

const validatePhone = (phone) => {
    const cleaned = phone.replace(/[\s\-\(\)]/g, "");
    if (!cleaned.startsWith("+1")) {
        return "+1" + cleaned;
    }
    return cleaned;
};

const sendAlerts = async (customers) => {
    const response = await fetch(ENDPOINT, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            apikey: API_KEY,
        },
        body: JSON.stringify({ customers }),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || `HTTP ${response.status}`);
    }

    return response.json();
};

const interactiveMode = async () => {
    const customers = [];

    while (true) {
        console.log("\n--- New Ticket ---");

        const name = await prompt("Name: ");
        const phone = await prompt("Phone: ");
        const order = await prompt("Order #: ");
        const date = await prompt("Date (MM/DD/YYYY): ");

        customers.push({
            name: name.trim(),
            phoneNumber: validatePhone(phone.trim()),
            orderNumber: order.trim(),
            date: formatDate(date.trim()),
        });

        const again = await prompt("\nAdd another? (y/n): ");
        if (again.toLowerCase() !== "y") break;
    }

    return customers;
};

const quickMode = async (flags) => {
    const required = ["name", "phone", "order", "date"];
    const missing = required.filter((f) => !flags[f]);

    if (missing.length > 0) {
        console.error(
            `Missing required flags: ${missing.map((f) => `--${f}`).join(", ")}`,
        );
        process.exit(1);
    }

    return [
        {
            name: flags.name,
            phoneNumber: validatePhone(flags.phone),
            orderNumber: flags.order,
            date: formatDate(flags.date),
        },
    ];
};

const main = async () => {
    if (!API_KEY) {
        console.error("Error: API_KEY not found in .env");
        process.exit(1);
    }

    const flags = parseArgs();
    const customers =
        Object.keys(flags).length > 0
            ? await quickMode(flags)
            : await interactiveMode();

    console.log(`\nSending ${customers.length} alert(s)...`);

    for (const c of customers) {
        console.log(
            `  - ${c.name} | ${c.phoneNumber} | ${c.orderNumber} | ${c.date}`,
        );
    }

    try {
        const result = await sendAlerts(customers);
        console.log("\nResults:");
        console.log(`  Sent: ${result.message.totalMessagesSent}`);
        console.log(`  Skipped: ${result.message.totalMessagesSkipped}`);

        if (result.message.skippedMessagesDetails?.length > 0) {
            console.log("\nSkipped:");
            for (const skip of result.message.skippedMessagesDetails) {
                console.log(`  - ${skip.customer.name}: ${skip.reason}`);
            }
        }

        console.log("\nDone!");
    } catch (err) {
        console.error(`\nError: ${err.message}`);
        process.exit(1);
    }

    rl.close();
};

main();

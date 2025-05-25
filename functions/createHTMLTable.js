const createHTMLTable = (data, title = "Expired Order Data Report") => {
    if (!Array.isArray(data) || data.length === 0) {
        return `<p>No data available.</p>`;
    }

    // Define custom headers and order for your specific fields
    const fieldConfig = {
        orderNumber: { label: "Order #", priority: 1 },
        name: { label: "Customer Name", priority: 2 },
        phoneNumber: { label: "Phone", priority: 3 },
        initialPickupDate: { label: "Original Pickup Date", priority: 4 },
        expirationDate: { label: "Expired", priority: 5 },
        status: { label: "Status", priority: 6 },
        reminderSentDate: { label: "Reminder Sent", priority: 7 },
        lastUpdated: { label: "Last Updated", priority: 8 },
    };

    // Get headers in priority order
    const headers = Object.keys(fieldConfig)
        .filter((key) => data[0].hasOwnProperty(key))
        .sort((a, b) => fieldConfig[a].priority - fieldConfig[b].priority);

    // Email-safe table with inline styles
    const tableStyle = `
    width: 100%;
    border-collapse: collapse;
    font-family: Arial, sans-serif;
    font-size: 14px;
    margin: 20px 0;
  `;

    const headerStyle = `
    background-color: #4a90e2;
    color: white;
    padding: 12px 8px;
    text-align: left;
    border: 1px solid #ddd;
    font-weight: bold;
  `;

    const cellStyle = `
    padding: 10px 8px;
    border: 1px solid #ddd;
    text-align: left;
  `;

    const rowStyle = (index) => `
    background-color: ${index % 2 === 0 ? "#f9f9f9" : "white"};
  `;

    const headerRow = headers
        .map(
            (header) =>
                `<th style="${headerStyle}">${fieldConfig[header].label}</th>`
        )
        .join("");

    const dataRows = data
        .map((row, index) => {
            const cells = headers
                .map((header) => {
                    let value = row[header];

                    // Format specific field types
                    if (
                        header === "expirationDate" ||
                        header === "lastUpdated" ||
                        header === "reminderSentDate"
                    ) {
                        // Format ISO dates to readable format
                        if (value) {
                            const date = new Date(value);
                            value =
                                date.toLocaleDateString() +
                                " " +
                                date.toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                });
                        }
                    } else if (header === "initialPickupDate") {
                        // Already in MM/DD/YYYY format, keep as is
                        value = value || "-";
                    } else if (header === "phoneNumber") {
                        // Format phone number nicely
                        if (value && value.length >= 10) {
                            const cleaned = value.replace(/\D/g, "");
                            value = `(${cleaned.slice(
                                -10,
                                -7
                            )}) ${cleaned.slice(-7, -4)}-${cleaned.slice(-4)}`;
                        }
                    } else if (header === "status") {
                        // Style status with color
                        const statusColor = "#e74c3c"
                        return `<td style="${cellStyle}"><span style="color: ${statusColor}; font-weight: bold; text-transform: uppercase;">${
                            "expired" || "-"
                        }</span></td>`;
                    } else if (
                        value === null ||
                        value === undefined ||
                        value === ""
                    ) {
                        value = "-";
                    }

                    return `<td style="${cellStyle}">${value}</td>`;
                })
                .join("");

            return `<tr style="${rowStyle(index)}">${cells}</tr>`;
        })
        .join("");

    return `
    <div style="font-family: Arial, sans-serif;">
      <h2 style="color: #333; margin-bottom: 20px;">${title}</h2>
      <table style="${tableStyle}">
        <thead>
          <tr>${headerRow}</tr>
        </thead>
        <tbody>
          ${dataRows}
        </tbody>
      </table>
      <p style="font-size: 12px; color: #666; margin-top: 20px;">
        Total records: ${data.length}
      </p>
    </div>
  `;
};

export default createHTMLTable;

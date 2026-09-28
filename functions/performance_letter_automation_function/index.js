const express = require("express");
const catalyst = require("zcatalyst-sdk-node");
const stream = require("stream");

const app = express();

// Handle large base64 PDF payloads
app.use(express.json({ limit: "15mb" }));

// Enable CORS
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }
  next();
});

app.get("/", (req, res) => {
  res.json({
    status: "success",
    message: "Performance Letter API is running"
  });
});

app.post("/send-letter", async (req, res) => {
  try {
    const {
      employeeName,
      employeeEmail,
      fileName,
      pdfBase64
    } = req.body;

    if (!employeeEmail) {
      return res.status(400).json({
        success: false,
        message: "Employee email is missing"
      });
    }

    if (!pdfBase64) {
      return res.status(400).json({
        success: false,
        message: "PDF data is missing"
      });
    }

    const catalystApp = catalyst.initialize(req);

    // Convert Base64 directly to memory stream
    const pdfBuffer = Buffer.from(pdfBase64, "base64");
    const attachmentStream = new stream.PassThrough();
    attachmentStream.end(pdfBuffer);
    attachmentStream.path = fileName || `Performance_Letter_${Date.now()}.pdf`;

    await catalystApp.email().sendMail({
      // ⚠️ REPLACE with your verified sender address from Catalyst Console -> Mail
      from_email: "sarmistha.a@race2cloud.com", 
      to_email: [employeeEmail],
      subject: `Performance Letter - ${employeeName || "Employee"}`,
      html_mode: true,
      content: `Dear ${employeeName || "Employee"},

Please find your approved performance letter attached to this email.


Regards,


Human Resources Team

  `,
  attachments: [attachmentStream]
});

return res.status(200).json({
  success: true,
  message: "Performance letter sent successfully"
});
} catch (error) {
console.error("Send letter error:", error);

// Capture raw error details from Catalyst SDK
const detailedError =
  (error && error.message) ||
  (typeof error === "object" ? JSON.stringify(error) : String(error));

return res.status(500).json({
  success: false,
  message: detailedError || "Failed to send performance letter"
});
}
});

module.exports = app;
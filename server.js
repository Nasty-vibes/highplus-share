const express = require("express");
const nodemailer = require("nodemailer");
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Store verification codes with expiration
let verificationCodes = {}; // { email: { code, expiresAt } }

app.post("/send-code", async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: "Email is required" });

  const code = Math.floor(100000 + Math.random() * 900000);
  const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes

  verificationCodes[email] = { code, expiresAt };

  // Setup Nodemailer with Gmail
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "your-email@gmail.com",         // <-- your Gmail
      pass: "your-app-password"             // <-- 16-char app password
    }
  });

  const mailOptions = {
    from: "your-email@gmail.com",
    to: email,
    subject: "High Plush Share Verification Code",
    text: `Your verification code is: ${code}. It expires in 5 minutes.`
  };

  try {
    await transporter.sendMail(mailOptions);
    res.json({ message: "Verification code sent!" });
  } catch (err) {
    console.error("Failed to send email:", err);
    res.status(500).json({ message: "Failed to send code. Check server logs." });
  }
});

app.post("/verify-code", (req, res) => {
  const { email, code } = req.body;
  const record = verificationCodes[email];

  if (!record) return res.status(400).json({ message: "No code sent to this email" });

  if (Date.now() > record.expiresAt) {
    delete verificationCodes[email];
    return res.status(400).json({ message: "Code expired. Request a new one." });
  }

  if (record.code == code) {
    delete verificationCodes[email];
    res.json({ message: "Email verified successfully!" });
  } else {
    res.status(400).json({ message: "Incorrect code" });
  }
});

app.listen(3000, () => console.log("Server running on http://localhost:3000"));

const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());

// Middleware: validate API key
function authenticate(req, res, next) {
    const authHeader = req.headers['authorization'];
    if (!authHeader) {
        return res.status(401).json({ success: false, message: 'Missing Authorization header' });
    }

    const token = authHeader.split(' ')[1]; // "Bearer <API_KEY>"
    if (token !== process.env.VM_API_KEY) {
        return res.status(403).json({ success: false, message: 'Invalid API key' });
    }

    next();
}

// Health check
app.get('/', (req, res) => {
    res.json({ status: 'ok', message: 'VM email server running', timestamp: new Date().toISOString() });
});

app.get('/health', (req, res) => {
    res.json({ status: 'healthy' });
});

// Nodemailer transporter
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS // Gmail App Password
    }
});

// Protected email endpoint
app.post('/send-email', authenticate, (req, res) => {
    const { to, subject, text } = req.body;

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to,
        subject,
        text
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error("❌ Error sending email:", error);
            return res.status(500).json({ success: false, message: error.toString() });
        }

        console.log("✅ Email sent:", info.response);
        res.status(200).json({ success: true, message: "Email sent: " + info.response });
    });
});

const PORT = process.env.EMAIL_PORT || 5001;
const HOST = '0.0.0.0';

app.listen(PORT, HOST, () => {
    console.log(`🚀 VM Email server running on ${HOST}:${PORT}`);
    console.log(`🔑 API key protection enabled`);
});

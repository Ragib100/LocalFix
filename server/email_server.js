const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Allowed origins
const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:3000',
    'https://localfix.vercel.app',
    process.env.CLIENT_URL
].filter(Boolean);

app.use(cors({
    origin: function (origin, callback) {
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin) || allowedOrigins.some(allowed => origin.startsWith(allowed))) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));
app.use(express.json());

// Health check
app.get('/', (req, res) => {
    res.json({ status: 'ok', message: 'Relay server running', timestamp: new Date().toISOString() });
});

app.get('/health', (req, res) => {
    res.json({ status: 'healthy' });
});

// Relay endpoint
app.post('/send-email', async (req, res) => {
    const { to, subject, text } = req.body;

    try {
        const response = await fetch(`${process.env.VM_EMAIL_SERVER_URL}/send-email`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.VM_API_KEY}` // 🔑 API key included here
            },
            body: JSON.stringify({ to, subject, text })
        });

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(errText);
        }

        const data = await response.json();
        res.status(200).json({ success: true, message: data.message });
    } catch (error) {
        console.error("❌ Relay error:", error);
        res.status(500).json({ success: false, message: error.toString() });
    }
});

const PORT = process.env.PORT || 5001;
const HOST = process.env.NODE_ENV === 'production' ? '0.0.0.0' : 'localhost';

app.listen(PORT, HOST, () => {
    console.log(`🚀 Relay server running on ${HOST}:${PORT}`);
    console.log(`🔑 Forwarding to VM: ${process.env.VM_EMAIL_SERVER_URL}`);
});

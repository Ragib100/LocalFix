const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

const sendEmail = async (req, res) => {
    try {
        const { to, subject, text } = req.body;

        await resend.emails.send({
            from: process.env.Email_from,
            to,
            subject,
            text
        });

        res.json({ success: true, message: 'Email sent successfully' });
    } catch (error) {
        console.error("Error sending email:", error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to send email',
            error: error.message 
        });
    }
}

module.exports = {sendEmail};

import { getEmailUrl } from './config';

function Send_email(email, otp) {
    // console.log("Sending email to:", email, "with OTP:", otp);
    return fetch(`${getEmailUrl()}/send-email`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            to: email,
            subject: "Your OTP Code",
            text: `Your OTP code is ${otp}. Please use this code to complete your authentication.`,
        }),
    })
    .then((response) => {
        if (!response.ok) {
            throw new Error("Network response was not ok");
        }
        return response.json();
    })
    .then((data) => {
        // console.log("Email sent successfully:", data);
        alert("Email sent successfully");
        return data;
    })
    .catch((error) => {
        console.error("Error sending email:", error);
        throw error; // Re-throw the error to be handled by the caller
    });
}

export default Send_email;
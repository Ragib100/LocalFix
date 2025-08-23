import React from "react";
import { useLocation } from "react-router-dom";
import Send_email from "../../utils/send_email";

function VerifyEmail() {
    const location = useLocation();
    const email = new URLSearchParams(location.search).get("email");
    const [otp,set_otp] = React.useState("");
    const [input_otp, set_input_otp] = React.useState("");
    const sent_otp = React.useRef(false);
    console.log("Email for verification:", email);

    const send_otp = async (e = null) => {
        if (e) e.preventDefault();
        const OTP = Math.floor(100000 + Math.random() * 900000).toString();
        set_otp(OTP);
        console.log("Sending OTP to:", email, "with OTP:", OTP);

        try{
            const response = await Send_email(email, OTP);
            if (response.success) {
                console.log("OTP sent successfully");
            } else {
                alert("Failed to send OTP. Please try again.");
            }
        }
        catch (error) {
            console.error("Error sending OTP:", error);
            alert("An error occurred while sending the OTP. Please try again.");
        }
    }

    const verify_otp = (e) => {
        e.preventDefault();
        if (input_otp === otp) {
            alert("OTP verified successfully");
            window.location.href = "/";
        } else {
            alert("Invalid OTP. Please try again.");
        }
    }

    React.useEffect(() => {
        if(!sent_otp.current && email) {
            send_otp();
            sent_otp.current = true;
        }
    }, []);


    return (
        <div className="container small">
            <div className="form-box small">
                <form>
                    <h1>Verify Email</h1>
                    <div className="input-box">
                        <input
                            type="text" 
                            placeholder="Enter verification code"
                            value={input_otp}
                            onChange={(e) => set_input_otp(e.target.value)}
                        />
                        <i className='bx bx-key' />
                    </div>
                    <div>
                        <a
                            href="#"
                            className="resend-link"
                            onClick={() => window.location.href = `/verify_email?email=${encodeURIComponent(email)}`}
                        >
                            Resend Verification Code
                        </a>
                    </div>
                    <button
                        type="submit"
                        className="button"
                        onClick={verify_otp}
                    >
                        Verify Email
                    </button>
                </form>
            </div>
        </div>
    );
}

export default VerifyEmail;
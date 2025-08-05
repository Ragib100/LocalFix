import React,{useState} from "react";
import Send_email from "../utils/send_email";

function Forgot_password() {

    const [sent_otp, set_sent_otp] = useState(false);
    const [otp, set_otp] = useState("");
    const [input_otp, set_input_otp] = useState("");
    const [email, set_email] = useState("");

    const send_otp = async (e) => {
        e.preventDefault();
        if (!email) {
            alert("Please enter your email");
            return;
        }

        const OTP = Math.floor(100000 + Math.random() * 900000).toString();
        set_otp(OTP);
        console.log("Sending OTP to:", email, "with OTP:", OTP);

        try {
            const response = await Send_email(email, OTP);
            if (response.success) {
                alert("OTP sent to your email");
                set_sent_otp(true);
            } else {
                alert("Failed to send OTP. Please try again.");
            }
        } catch (error) {
            console.error("Error sending OTP:", error);
            alert("An error occurred while sending the OTP. Please try again.");
        }
    }
    
    const verify_otp = (e) => {
        e.preventDefault();
        if (input_otp === otp) {
            alert("OTP verified successfully");
            window.location.href = "/forgot_password/change_password";
        } else {
            alert("Invalid OTP");
        }
    }

    return(
        <div className="container small">
            <div className="form-box small">
                <form>
                    <h1>Forgot Password</h1>
                    <div className="input-box">
                        <input
                            type="email"
                            placeholder="Email"
                            onChange={(e) => set_email(e.target.value)}
                            required
                        />
                        <i class='bxr  bx-envelope' />
                    </div>
                    <div className={`input-box ${!sent_otp ? 'hidden' : ''}`}>
                        <input 
                            type="text"
                            placeholder="Verification Code"
                            onChange={(e) => set_input_otp(e.target.value)}
                            required
                        />
                        <i class='bxr  bx-lock' />
                    </div>
                    <button
                        type="submit"
                        className="button"
                        onClick={sent_otp ? verify_otp : send_otp}
                    >
                        {sent_otp ? "Verify OTP" : "Send OTP"}
                    </button>
                </form>
            </div>
        </div>
    );
}

export default Forgot_password;
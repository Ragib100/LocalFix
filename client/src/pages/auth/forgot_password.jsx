import React,{useState} from "react";
import Set_new_password from "./set_new_password";
import Send_email from "../../utils/send_email";
import '../../styles/common/change_password.css';
import { useNavigate } from "react-router-dom";

function Forgot_password({ onClose }) {

    const [otp, set_otp] = useState("");
    const [input_otp, set_input_otp] = useState("");
    const [email, set_email] = useState("");
    const [sent_otp, set_sent_otp] = useState(false);
    const [otp_verified, set_otp_verified] = useState(false);
    const navigate = useNavigate();

    const send_otp = async (e) => {
        e.preventDefault();
        if (!email) {
            alert("Please enter your email");
            return;
        }
        const OTP = Math.floor(100000 + Math.random() * 900000).toString();
        set_otp(OTP);
        // console.log("Sending OTP to:", email, "with OTP:", OTP);
        
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
            set_otp_verified(true);
        } else {
            alert("Invalid OTP");
        }
    }

    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget) {
            navigate("/auth");
        }
    }

    return(
        <div className="modal-overlay" onClick={handleBackdropClick}>
            <div className="modal-content">
                <div className="modal-header">
                    <button className="modal-close" onClick={handleBackdropClick}>×</button>
                </div>
                <div className="modal-body">
                    {!otp_verified  && (
                        <form>
                            <h1>Verify Your Email</h1>
                            <div className="input-box">
                                <input
                                    type="email"
                                    placeholder="Email"
                                    onChange={(e) => set_email(e.target.value)}
                                    required
                                />
                                <i class='bx  bx-envelope' />
                            </div>
                            <div className={`input-box ${!sent_otp ? 'hidden' : ''}`}>
                                <input 
                                    type="text"
                                    placeholder="Verification Code"
                                    onChange={(e) => set_input_otp(e.target.value)}
                                    required
                                />
                                <i className='bx bx-key' />
                            </div>
                            <button
                                type="submit"
                                className="button"
                                onClick={sent_otp ? verify_otp : send_otp}
                            >
                                {sent_otp ? "Verify OTP" : "Send OTP"}
                            </button>
                        </form>
                    )}

                    {otp_verified && (
                        <Set_new_password
                            email={email} 
                            id={0}
                            onComplete={onClose}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}

export default Forgot_password;
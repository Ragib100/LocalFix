import { useEffect, useState, useRef } from "react";
import Send_email from "../../utils/send_email";
import '../../styles/common/change_password.css';

function Signup_verification({ email, set_otp_verified, set_show_verification_modal }) {

    const [input_otp, set_input_otp] = useState("");
    const [otp, set_otp] = useState("");
    const current=useRef(false);

    const sendOTP = async () => {
        if (email) {
            const OTP = Math.floor(100000 + Math.random() * 900000).toString();
            set_otp(OTP);
            // console.log("Sending OTP to:", email, "with OTP:", OTP);
            
            try {
                const response = await Send_email(email, OTP);
                if (response.success) {
                    console.log("OTP sent successfully to:", email);
                } else {
                    alert("Failed to send OTP. Please try again.");
                }
            } catch (error) {
                console.error("Error sending OTP:", error);
                alert("An error occurred while sending the OTP. Please try again.");
            }
        }
    };

    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget) {
            set_show_verification_modal(false);
        }
    };

    const verify_otp = (e) => {
        e.preventDefault();
        if (!input_otp) {
            alert("Please enter the verification code");
            return;
        }
        
        if (input_otp === otp) {
            set_otp_verified(true);
            set_show_verification_modal(false);
            alert("Email verified successfully!");
        } else {
            alert("Invalid verification code. Please try again.");
        }
    };

    const resendOTP = async () => {
        current.current = false;
        await sendOTP();
    };

    useEffect(() => {
        // Generate and send OTP only once when component mounts
        if (!current.current) {
            sendOTP();
            current.current = true;
        }
    }, []);

    return (
        <div className="modal-overlay" onClick={handleBackdropClick}>
            <div className="modal-content">
                <div className="modal-header">
                    <button className="modal-close" onClick={handleBackdropClick}>×</button>
                </div>
                <div className="modal-body">
                    <form>
                        <h1>Verify Your Email</h1>
                        <p style={{textAlign: 'center', marginBottom: '20px', color: '#666'}}>
                            We've sent a verification code to <strong>{email}</strong>
                        </p>
                        <div className="input-box">
                            <input 
                                type="text"
                                placeholder="Enter 6-digit verification code"
                                value={input_otp}
                                onChange={(e) => set_input_otp(e.target.value)}
                                maxLength="6"
                                required
                            />
                            <i className='bx bx-key' />
                        </div>
                        <button
                            type="submit"
                            className="button"
                            onClick={verify_otp}
                        >
                            Verify OTP
                        </button>
                        <div style={{textAlign: 'center', marginTop: '15px'}}>
                            <span style={{color: '#666'}}>Didn't receive the code? </span>
                            <button
                                type="button"
                                onClick={resendOTP}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: '#007bff',
                                    textDecoration: 'underline',
                                    cursor: 'pointer',
                                    fontSize: '14px'
                                }}
                            >
                                Resend OTP
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default Signup_verification;
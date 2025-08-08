import React,{useState} from "react";
import "../CSS/welcome.css";

function Change_password() {

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [focus_password, setFocusPassword] = useState(false);
    const [focus_confirm_password, setFocusConfirmPassword] = useState(false);

    const [password_validity, set_password_validity] = useState({
        length: false,
        uppercase: false,
        lowercase: false,
        numbers: false,
        special_characters: false,
    });
    const [same_password, set_same_password] = useState(false);

    const check_password = (e) => {
        const value = e.target.value;
        setPassword(value);
        set_password_validity({
            length: value.length >= 8,
            uppercase: /[A-Z]/.test(value),
            lowercase: /[a-z]/.test(value),
            numbers: /[0-9]/.test(value),
            special_characters: /[!@#$%^&*]/.test(value),
        });
    };

    const check_confirm_password = (e) => {
        setConfirmPassword(e.target.value);
        set_same_password(e.target.value === password);
    };

    const handle_submit = (e) => {
        e.preventDefault();
        if (password === confirmPassword && Object.values(password_validity).every(Boolean)) {
            console.log("Password changed successfully");
        }
        else {
            console.log("Password validation failed");
        }
    }

    return(
        <div className="container small">
            <div className="form-box small">
                <form onSubmit={handle_submit}>
                    <h1>Change Password</h1>
                    <div className="input-box">
                        <input
                            type="password"
                            placeholder="New Password"
                            onChange={check_password}
                            onFocus={() => setFocusPassword(true)}
                            onBlur={() => setFocusPassword(false)}
                            required
                        />
                        <i className='bx bx-lock' />
                    </div>
                    <div className={`password-validity ${focus_password ? 'visible' : 'hidden'}`}>
                        <p>{password_validity.length ? "✅" : "❌"} At least 8 characters</p>
                        <p>{password_validity.uppercase ? "✅" : "❌"} At least 1 uppercase letter</p>
                        <p>{password_validity.lowercase ? "✅" : "❌"} At least 1 lowercase letter</p>
                        <p>{password_validity.numbers ? "✅" : "❌"} At least 1 number</p>
                        <p>{password_validity.special_characters ? "✅" : "❌"} At least 1 special character</p>
                    </div>
                    <div className="input-box">
                        <input
                            type="password"
                            placeholder="Confirm Password"
                            onChange={check_confirm_password}
                            onFocus={() => setFocusConfirmPassword(true)}
                            onBlur={() => setFocusConfirmPassword(false)}
                            required
                        />
                        <i className='bx bx-lock' />
                    </div>
                    <div className={`password-match ${focus_confirm_password ? 'visible' : 'hidden'}`}>
                        <p>{same_password ? "✅" : "❌"} Passwords match</p>
                    </div>
                    <button
                        type="submit"
                        className="button"
                    >
                        Change Password
                    </button>
                </form>
            </div>
        </div>
    );
}

export default Change_password;
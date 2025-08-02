import React,{useState} from "react";
import { createUserWithEmailAndPassword, sendEmailVerification } from "firebase/auth";
import { auth } from "./firebase"; 

function Signup() {

    const [focus_password , set_focus_password] = useState(false);
    const [focus_confirm_password , set_focus_confirm_password] = useState(false);
    const [password,set_password] = useState("");
    const [confirm_password , set_confirm_password] = useState("");
    const [email,set_email] = useState("");
    const [valid , set_validation] = useState({
        length : false ,
        uppercase : false ,
        lowercase : false ,
        number : false ,
        special : false
    });

    const handle_Signup = async (e) => {
        e.preventDefault();
        if(password!=confirm_password){
            alert("Password not matched");
            return;
        }
        if(!valid.length || !valid.lowercase || !valid.number || !valid.special || !valid.uppercase){
            alert("Password is not valid");
            return;
        }
        
        try{
            const user_credential = await createUserWithEmailAndPassword(auth,email,password);
            const user = user_credential.user;
            await sendEmailVerification(user);
            alert("Signup successful! Please check your email to verify your account.");
            window.location.reload();
        }
        catch(error) {
            alert("Sign up failed " + error.message);
        }
    }

    const handle_password = (e) => {
        const password = e.target.value;
        set_password(password);
        set_validation({
            length : password.length>=8 && password.length<=15,
            uppercase : /[A-Z]/.test(password),
            lowercase : /[a-z]/.test(password),
            number : /[0-9]/.test(password),
            special : /[!@#$%^&*(),.?":{}|<>]/.test(password)
        })
        
    }

    const handle_confirm_password = (e) => {
        const confirm_password = e.target.value;
        if(confirm_password==password) set_confirm_password(confirm_password);
        else set_confirm_password(confirm_password);
    }

    const getmark = (valid) => (valid ? "✅" : "❌");

    return(
        <form onSubmit={handle_Signup}>
            <div>
                <label>Email</label>
                <input
                    type="email"
                    name="email"
                    onChange={(e) => set_email(e.target.value)}
                    required
                />
            </div>
            <div>
                <label>Password</label>
                <input 
                    type="password"
                    name="password"
                    onChange={handle_password}
                    onFocus={() => set_focus_password(true)}
                    onBlur={() => set_focus_password(false)}
                    required
                />
                {focus_password && 
                    <>
                        <p>{getmark(valid.length)} At least 8 and at most 15 characters</p>
                        <p>{getmark(valid.uppercase)} At least one uppercase</p>
                        <p>{getmark(valid.lowercase)} At least one lowercase</p>
                        <p>{getmark(valid.number)} At least one number</p>
                        <p>{getmark(valid.special)} At least one special character</p>
                    </>  
                }
            </div>
            <div>
                <label>Confirm Password</label>
                <input
                    type="password"
                    name="confirmPassword"
                    onChange={handle_confirm_password}
                    onFocus={() => set_focus_confirm_password(true)}
                    onBlur={() => set_focus_confirm_password(false)}
                    required
                />
                {focus_confirm_password && password==confirm_password && <p>✅ Password matched</p>}
            </div>
            <button type="submit">Signup</button>
        </form>
    );
}

export default Signup;
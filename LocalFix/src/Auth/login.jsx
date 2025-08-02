import React from "react";
import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "./firebase";

function Login() {

    const [email,set_email] = useState("");
    const [password,set_password] = useState("");
    
    const handle_log_in = async (e) => {
        e.preventDefault();

        try{
            const user_credential = await signInWithEmailAndPassword(auth,email,password);
            const user = user_credential.user;
            if(user.emailVerified) {
                alert("Log in successful");
            }
            else {
                alert("Please verify email first");
            }
        }
        catch(error) {
            alert("Login failed "+error.message);
        }
    }

    return(
        <form onSubmit={handle_log_in}>
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
                    onChange={(e) => set_password(e.target.value)}
                    required
                />
            </div>
            <button type="submit">Login</button>
        </form>
    );
}

export default Login;

import React,{useState} from "react";

function Login() {

    const [email,set_email] = useState("");
    const [password,set_password] = useState("");
    
    const handle_log_in = (e) => {
        e.preventDefault();

        console.log(email + " " + password);
        
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

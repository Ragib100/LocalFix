import React,{useState} from "react";
import Login from "./login";
import Signup from "./signup";

function Welcome() {
    const [active_page, set_active_page] = useState("Login");

    const handle_log_in = () => {
        if(active_page=="Login") return;
        console.log("Login button clicked");
        set_active_page("Login");
    }
    
    const handle_sign_up = () => {
        if(active_page=="Signup") return;
        console.log("Signup button clicked");
        set_active_page("Signup");
    }
    
    return (
        <div>
            <button onClick={handle_log_in}>Login</button>
            <button onClick={handle_sign_up}>Signup</button>
            {active_page=="Login" && <Login />}
            {active_page=="Signup" && <Signup />}
        </div>
    );
}

export default Welcome;

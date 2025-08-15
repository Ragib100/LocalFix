import React,{useState} from "react";
import {Link} from "react-router-dom";
import "../../CSS/dashboard.css";

function AdminDashboard() {

    const [currentTab, setCurrentTab] = useState("Home");

	return (
		<div className="dashboard-container">
            <div className="left-panel">
                <header>
                    <a href="#">LocalFix</a>
                </header>
                <div className="left-button">
                    <button
                        onClick={() => setCurrentTab("Home")}
                        style={currentTab === "Home" ? { backgroundColor: "#bcd6fbff" } : {}}
                    >
                        <i className="bx bx-home"> Home</i>
                    </button>
                    <button
                        onClick={() => setCurrentTab("Profile")}
                        style={currentTab === "Profile" ? { backgroundColor: "#bcd6fbff" } : {}}
                    >
                        <i className="bx bx-user"> Profile</i>
                    </button>
					<button
                        onClick={() => setCurrentTab("New Problems")}
                        style={currentTab === "New Problems" ? { backgroundColor: "#bcd6fbff" } : {}}
                    >
                        <i className="bx bx-briefcase"> New Problems</i>
                    </button>
                    <button
                        onClick={() => setCurrentTab("Pending")}
                        style={currentTab === "Pending" ? { backgroundColor: "#bcd6fbff" } : {}}
                    >
                        <i className="bx bx-time"> Pending</i>
                    </button>
                    <button
                        onClick={() => setCurrentTab("Completed")}
                        style={currentTab === "Completed" ? { backgroundColor: "#bcd6fbff" } : {}}
                    >
                        <i className="bx bx-check"> Completed</i>
                    </button>
                </div>
            </div>

            <div className="right-panel">
                <header>
                    <button>
                        <Link to="/" style={{color: "white"}}>
                            <i className="bx bx-log-out"> Logout</i>
                        </Link>
                    </button>
                </header>
            </div>
        </div>
	);
}

export default AdminDashboard;
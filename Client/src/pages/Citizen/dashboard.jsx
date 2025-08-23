import React,{useState} from "react";
import {Link} from "react-router-dom";
import "../../CSS/dashboard.css";

function CitizenDashboard() {

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
                        onClick={() => setCurrentTab("Problems")}
                        style={currentTab === "Problems" ? { backgroundColor: "#bcd6fbff" } : {}}
                    >
                        <i className="bx bx-briefcase"> Problems</i>
                    </button>
                    <button
                        onClick={() => setCurrentTab("In Progress")}
                        style={currentTab === "In Progress" ? { backgroundColor: "#bcd6fbff" } : {}}
                    >
                        <i className="bx bx-time"> In Progress</i>
                    </button>
                    <button
                        onClick={() => setCurrentTab("Solved")}
                        style={currentTab === "Solved" ? { backgroundColor: "#bcd6fbff" } : {}}
                    >
                        <i className="bx bx-check"> Solved</i>
                    </button>
                </div>
            </div>

            <div className="right-panel">
                <header>
                    <button>
                        <Link to="/">
                            <i className="bx bx-log-out"> Logout</i>
                        </Link>
                    </button>
                </header>
            </div>
        </div>
	);
}

export default CitizenDashboard;
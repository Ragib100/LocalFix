import React,{useState} from "react";
import {Link} from "react-router-dom";
import Home from "./Home/home";
import Profile from "../Common/Profile/profile";
import Jobs from "./Jobs/jobs";
import Pending from "./Pending/pending";
import Completed from "./Completed/completed";
import Earnings from "./Earnings/earnings";
import "../../CSS/dashboard.css";

function WorkerDashboard() {

    const [currentTab, setCurrentTab] = useState("Home");

    const RenderContent = () => {
        switch (currentTab) {
            case "Home":
                return <Home />;
            case "Profile":
                return <Profile />;
            case "Jobs":
                return <Jobs />;
            case "Pending":
                return <Pending />;
            case "Completed":
                return <Completed />;
            case "Earnings":
                return <Earnings />;
            default:
                return null;
        }
    }

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
                        onClick={() => setCurrentTab("Jobs")}
                        style={currentTab === "Jobs" ? { backgroundColor: "#bcd6fbff" } : {}}
                    >
                        <i className="bx bx-briefcase">Available Jobs</i>
                    </button>

                    <button
                        onClick={() => setCurrentTab("Pending")}
                        style={currentTab === "Pending" ? { backgroundColor: "#bcd6fbff" } : {}}
                    >
                        <i className="bx bx-time">Assigned</i>
                    </button>
                    
                    <button
                        onClick={() => setCurrentTab("Earnings")}
                        style={currentTab === "Earnings" ? { backgroundColor: "#bcd6fbff" } : {}}
                    >
                        <i className="bx bx-dollar"> Earnings</i>
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
                <div> {RenderContent()} </div>
            </div>
        </div>
	);
}

export default WorkerDashboard;
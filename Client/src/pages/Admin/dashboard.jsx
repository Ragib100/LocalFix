import React,{useState} from "react";
import {Link} from "react-router-dom";
import Home from "./Home/home";
import Applications from "./Applications/total_applications";
import Issues from "./Issues/view_issues";
import ReviewProblems from "./Review/review_problem";
import Profile from "../Common/Profile/profile"
import "../../CSS/dashboard.css";

function AdminDashboard() {

    const [currentTab, setCurrentTab] = useState("Home");

    const RenderContent = () => {
        switch (currentTab) {
            case "Home":
                return <Home />;
            case "Profile":
                return <Profile />;
            case "Issues":
                return <Issues />;
            case "Applications":
                return <Applications />;
            case "Review Problems":
                return <ReviewProblems />;
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
                        onClick={() => setCurrentTab("Applications")}
                        style={currentTab === "Applications" ? { backgroundColor: "#bcd6fbff" } : {}}
                    >
                        <i className="bx bx-check">Total Applications</i>
                    </button>

                    <button
                        onClick={() => setCurrentTab("Issues")}
                        style={currentTab === "Issues" ? { backgroundColor: "#bcd6fbff" } : {}}
                    >
                        <i className="bx bx-time">View Issues</i>
                    </button>

					<button
                        onClick={() => setCurrentTab("Review Problems")}
                        style={currentTab === "Review Problems" ? { backgroundColor: "#bcd6fbff" } : {}}
                    >
                        <i className="bx bx-briefcase"> Review Problems</i>
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

export default AdminDashboard;
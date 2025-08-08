import React from "react";
import {Link} from "react-router-dom";
import "../../CSS/dashboard.css";

function Dashboard() {
	return (
		<div className="dashboard-container">
            <div className="left_buttons">
                <Link to="/">LocalFix</Link>
                <button>
                    <i className='bx bx-home'/>
                    <span>   Home</span>
                </button>
                <button>
                    <i className='bx bx-dollar'/>
                    <span>   Earnings</span>
                </button>
                <button>
                    <i className='bx bx-time'/> 
                    <span>   Pending</span>
                </button>
                <button>
                    <i className='bx bx-check'/> 
                    <span>   Completed</span>
                </button>
            </div>

            <div className="right_content">
                <header>
                    <i class='bx  bx-user-circle'/>
                </header>
            </div>
        </div>
	);
}

export default Dashboard;
import React,{useState} from "react";
import "./home.css"

function Home() {

    const [invoices,set_invoices] = useState({
        first:"Mirpur Rasta" , status:"Paid" , bill:"1500"
    });

    return (
        <div>
            <div className="headings">
                <div className="worker-data">
                    <h2>Pending</h2>
                </div>
                <div className="worker-data">
                    <h2>Completed</h2>
                </div>
                <div className="worker-data">
                    <h2>Total Earings</h2>
                </div>
            </div>
            <div className="recent-updates">
                <h2>Recent Invoices</h2>
            </div>
            <div className="graph">
                {/* graph */}
            </div>
            <div className="recent-updates">
                <h2>there</h2>
            </div>
        </div>
    );
}

export default Home;
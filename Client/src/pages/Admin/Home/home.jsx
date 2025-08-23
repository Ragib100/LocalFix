import React,{ useState} from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { PieChart, Pie , Cell } from "recharts";
import "./home.css"

function Home() {
  
    const [bar_diagram, set_bar_diagram] = useState([]);

    const [pie_chart,set_pie_chart] = useState([]);
    const COLORS = ["#0088FE", "#00C49F", "#9b0ef3ff", "#FF8042", "#a2ac49ff"];

    const check_bar_diagram = () => {
        // code to get the assigned and solved number of last 6 months
        set_bar_diagram([
            { name: "Jan", Assigned: 10, Solved: 6 },
            { name: "Feb", Assigned: 12, Solved: 8 },
            { name: "Mar", Assigned: 15, Solved: 10 },
            { name: "Apr", Assigned: 20, Solved: 15 },
            { name: "May", Assigned: 25, Solved: 20 },
            { name: "Jun", Assigned: 30, Solved: 25 }
        ]);
    }

    const check_pie_chart = () => {
        // code to get the current status of tickets
        set_pie_chart([
            { name: "Assigned", value: 10 },
            { name: "Solved", value: 6 },
            { name: "Pending", value: 4 },
            { name: "Added Today", value: 2 },
            { name: "Solved Today", value: 1 }
        ]);
    }

    const [citizen,set_citizen] = useState(100);
    const [worker,set_worker] = useState(50);
    const [total_open_issue,set_total_open_issue] = useState(5);

    const check_citizen = () => {
        // code to get the total number of citizen
        set_citizen(citizen+10); // Example update
    }

    const check_worker = () => {
        // code to get the total number of worker
        set_worker(worker+10); // Example update
    }

    const check_avg_work = () => {
        // code to get the average work
        set_total_open_issue(total_open_issue+1);
    }

    React.useEffect(() => {
        console.log("Fetching data...");
        check_bar_diagram();
        check_pie_chart();
        check_citizen();
        check_worker();
        check_avg_work();
    }, []);

    return (
        <div>
            <div className="head-data">
                <div className="data">
                    <h2>
                        Total User
                        <button onClick={check_citizen}><i className="bx bx-refresh"/></button>
                    </h2>
                    <p>{citizen}</p>
                </div>

                <div className="data">
                    <h2>
                        Total Worker
                        <button onClick={check_worker}><i className="bx bx-refresh"/></button>
                    </h2>
                    <p>{worker}</p>
                </div>

                <div className="data">
                    <h2>
                        Total Open Issues
                        <button onClick={check_avg_work}><i className="bx bx-refresh"/></button>
                    </h2>
                    <p>{total_open_issue}</p>
                </div>
            </div>

            <div className="graph">
                <div>
                    <h3 className="graph-title">Previous Months Analysis</h3>
                    <BarChart width={400} height={300} data={bar_diagram}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="Assigned" fill="#8884d8" />
                        <Bar dataKey="Solved" fill="#82ca9d" />
                    </BarChart>
                </div>
            
                <div>
                    <h3 className="graph-title">Current Month Analysis</h3>
                    <PieChart width={400} height={300}>
                        <Pie
                            data={pie_chart}
                            cx="40%"
                            cy="40%"
                            outerRadius={80}
                            dataKey="value"
                            label
                        >
                            {pie_chart.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip />
                    </PieChart>
                </div>
            </div>
        </div>
    );
}

export default Home;
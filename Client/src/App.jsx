import React from "react";
import Welcome from "./pages/Welcome";
import VerifyEmail from "./pages/verify_email";
import Forgot_password from "./pages/forgot_pass";
import Change_password from "./components/change_password";
import Dashboard from "./pages/Citizen/dashboard";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

function App() {
	return (
		<Router>
			<Routes>
				<Route path="/" element={<Welcome />} />
				<Route path="/verify_email" element={<VerifyEmail />} />
				<Route path="/forgot_password" element={<Forgot_password />} />
				<Route path="/citizen_dashboard" element={<Dashboard />} />
				<Route path="/forgot_password/change_password" element={<Change_password />} />
			</Routes>
		</Router>
	);
}

export default App;
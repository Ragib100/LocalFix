import React from "react";
import { Link } from "react-router-dom";

function LoginForm({ email, password, user_type, setEmail, setPassword, set_user_type, onLogin }) {
	return (
		<form onSubmit={onLogin}>
			<h1>Login</h1>
			<div className="input-box">
				<input
					type="email"
					placeholder="Email"
					value={email}
					onChange={(e) => setEmail(e.target.value)}
					required
				/>
				<i className="bx bx-envelope" />
			</div>
			<div className="input-box">
				<input
					type="password"
					placeholder="Password"
					value={password}
					onChange={(e) => setPassword(e.target.value)}
					required
				/>
				<i className="bx bx-lock" />
			</div>
			<div className="dropdown">
				<select
					name="user"
					value={user_type}
					onChange={(e) => set_user_type(e.target.value)}
					required
				>
					<option value="" disabled>Select User Type</option>
					<option value="citizen">Citizen</option>
					<option value="worker">Worker</option>
					<option value="admin">Admin</option>
				</select>
			</div>
			<div className="remember-me">
				<input type="checkbox" id="remember-me" style={{ cursor: "pointer" }} />
				<label htmlFor="remember-me" style={{ cursor: "pointer" }}>Remember Me</label>
			</div>
			<div className="forgot-link">
				<Link to="/forgot_password">Forgot Password?</Link>
			</div>
			<button type="submit" className="button">Login</button>
		</form>
	);
}

export default LoginForm;

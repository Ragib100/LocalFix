import React from "react";
import { Link } from "react-router-dom";

function LoginForm({ email, password, setEmail, setPassword, onLogin }) {
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
			<div className="forgot-link">
				<Link to="/forgot_password">Forgot Password?</Link>
			</div>
			<button type="submit" className="button">Login</button>
		</form>
	);
}

export default LoginForm;

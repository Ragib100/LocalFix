import React, { useState } from "react";
import LoginForm from "../components/LoginForm";
import SignupForm from "../components/SignupForm";
import "../CSS/welcome.css";

function Welcome() {
	const [isLogin, setIsLogin] = useState(false);
	const [first, setFirst] = useState(true);

	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [focus_password, setFocusPassword] = useState(false);
	const [focus_confirm_password, setFocusConfirmPassword] = useState(false);

	const [password_validity, set_password_validity] = useState({
		length: false,
		uppercase: false,
		lowercase: false,
		numbers: false,
		special_characters: false,
	});
	const [same_password, set_same_password] = useState(false);

	const check_password = (e) => {
		const value = e.target.value;
		setPassword(value);
		set_password_validity({
			length: value.length >= 8,
			uppercase: /[A-Z]/.test(value),
			lowercase: /[a-z]/.test(value),
			numbers: /[0-9]/.test(value),
			special_characters: /[!@#$%^&*]/.test(value),
		});
	};

	const check_confirm_password = (e) => {
		setConfirmPassword(e.target.value);
		set_same_password(e.target.value === password);
	};

	const login = (e) => {
		e.preventDefault();
		console.log("Login with:", email, password);
	};

	const signup = (e) => {
		e.preventDefault();
		console.log("Signup with:", email, password, confirmPassword);
	};

	const handle_signup_toggle = () => {
		setFirst(false);
		setIsLogin(true);
	};

	const handle_login_toggle = () => {
		setIsLogin(false);
	};

	return (
		<div className="container">
			<div className="form-box login">
				<LoginForm
					email={email}
					password={password}
					setEmail={setEmail}
					setPassword={setPassword}
					onLogin={login}
				/>
			</div>

			<div className="form-box register">
				<SignupForm
					email={email}
					password={password}
					confirmPassword={confirmPassword}
					password_validity={password_validity}
					same_password={same_password}
					check_password={check_password}
					check_confirm_password={check_confirm_password}
					setEmail={setEmail}
					focus_password={focus_password}
					focus_confirm_password={focus_confirm_password}
					setFocusPassword={setFocusPassword}
					setFocusConfirmPassword={setFocusConfirmPassword}
					onSignup={signup}
				/>
			</div>

			<div className={`toggle ${first ? 'first' : `signup ${!isLogin ? 'on' : 'off'}`}`}>
				<h1>Hello, Welcome!</h1>
				<p>Don't have an account? </p>
				<button onClick={handle_signup_toggle} className="toggle-button">Sign up</button>
			</div>

			<div className={`toggle login ${isLogin ? 'on' : 'off'}`}>
				<h1>Welcome Back!</h1>
				<p>Already have an account? </p>
				<button onClick={handle_login_toggle} className="toggle-button">Login</button>
			</div>
		</div>
	);
}

export default Welcome;
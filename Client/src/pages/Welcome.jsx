import React, { useState } from "react";
import LoginForm from "../components/LoginForm";
import SignupForm from "../components/SignupForm";
import "../CSS/welcome.css";

function Welcome() {
	const [isLogin, setIsLogin] = useState(false);
	const [first, setFirst] = useState(true);

	const [name, setName] = useState("");
	const [number, setNumber] = useState("");
	const [email, setEmail] = useState("");
	const [latitude, setLatitude] = useState("");
	const [longitude, setLongitude] = useState("");
	const [password, setPassword] = useState("");
	const [user_type, set_user_type] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [focus_name, setFocusName] = useState(false);
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
		console.log("Login with:", email, password, user_type);
		// window.location.href = "/citizen_dashboard"; // Redirect to dashboard after login
	};

	const signup = (e) => {
		e.preventDefault();
		if (password === confirmPassword && Object.values(password_validity).every(Boolean)) {
			console.log("Signup with:", email, password, user_type, name, number, latitude, longitude);
		}
		else {
			console.log("Password validation failed");
		}
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
					user_type={user_type}
					setEmail={setEmail}
					setPassword={setPassword}
					set_user_type={set_user_type}
					onLogin={login}
				/>
			</div>

			<div className="form-box register">
				<SignupForm
					name={name}
					email={email}
					number={number}
					latitude={latitude}
					longitude={longitude}
					password={password}
					confirmPassword={confirmPassword}
					user_type={user_type}
					password_validity={password_validity}
					same_password={same_password}
					check_password={check_password}
					check_confirm_password={check_confirm_password}
					setName={setName}
					setEmail={setEmail}
					setNumber={setNumber}
					setLatitude={setLatitude}
					setLongitude={setLongitude}
					set_user_type={set_user_type}
					setFocusName={setFocusName}
					setFocusPassword={setFocusPassword}
					setFocusConfirmPassword={setFocusConfirmPassword}
					focus_name={focus_name}
					focus_password={focus_password}
					focus_confirm_password={focus_confirm_password}
					onSignup={signup}
				/>
			</div>

			<div className={`toggle ${first ? 'first' : `signup ${!isLogin ? 'on' : 'off'}`}`}>
				<h1>Hello, Welcome</h1>
				<p>Don't have an account? </p>
				<button onClick={handle_signup_toggle} className="toggle-button">Sign up</button>
			</div>

			<div className={`toggle login ${isLogin ? 'on' : 'off'}`}>
				<h1>Welcome Back</h1>
				<p>Already have an account? </p>
				<button onClick={handle_login_toggle} className="toggle-button">Login</button>
			</div>
		</div>
	);
}

export default Welcome;
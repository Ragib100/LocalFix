import React from "react";

function SignupForm({
	email,
	password,
	confirmPassword,
	password_validity,
	same_password,
	check_password,
	check_confirm_password,
	setEmail,
	setFocusPassword,
	setFocusConfirmPassword,
	focus_password,
	focus_confirm_password,
	onSignup
}) {
	return (
		<form onSubmit={onSignup}>
			<h1>Sign up</h1>
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
					onChange={check_password}
					onFocus={() => setFocusPassword(true)}
					onBlur={() => setFocusPassword(false)}
					required
				/>
				<i className="bx bx-lock" />
			</div>
			<div className={`password-validity ${focus_password ? 'visible' : 'hidden'}`}>
				<p>{password_validity.length ? "✅" : "❌"} At least 8 characters</p>
				<p>{password_validity.uppercase ? "✅" : "❌"} At least 1 uppercase letter</p>
				<p>{password_validity.lowercase ? "✅" : "❌"} At least 1 lowercase letter</p>
				<p>{password_validity.numbers ? "✅" : "❌"} At least 1 number</p>
				<p>{password_validity.special_characters ? "✅" : "❌"} At least 1 special character</p>
			</div>
			<div className="input-box">
				<input
					type="password"
					placeholder="Confirm Password"
					value={confirmPassword}
					onChange={check_confirm_password}
					onFocus={() => setFocusConfirmPassword(true)}
					onBlur={() => setFocusConfirmPassword(false)}
					required
				/>
				<i className="bx bx-lock" />
			</div>
			<div className={`password-match ${focus_confirm_password ? 'visible' : 'hidden'}`}>
				<p>{same_password ? "✅" : "❌"} Passwords match</p>
			</div>
			<button type="submit" className="button">Sign up</button>
		</form>
	);
}

export default SignupForm;

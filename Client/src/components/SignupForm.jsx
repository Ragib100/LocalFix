import React from "react";

function SignupForm({
	name,
	email,
	number,
	address,
	password,
	confirmPassword,
	user_type,
	password_validity,
	same_password,
	check_password,
	check_confirm_password,
	setName,
	setEmail,
	setNumber,
	setAddress,
	set_user_type,
	setFocusName,
	setFocusPassword,
	setFocusConfirmPassword,
	focus_name,
	focus_password,
	focus_confirm_password,
	onSignup
}) {
	return (
		<form onSubmit={onSignup}>
			<h1>Sign up</h1>
			<div className="input-box">
				<input
					type="text"
					placeholder="Full Name"
					value={name}
					onFocus={() => setFocusName(true)}
					onBlur={() => setFocusName(false)}
					onChange={(e) => e.target.value.length <= 50 && setName(e.target.value)}
					required
				/>
				<i className="bx bx-user" />
			</div>
			<div className={`name-validity ${focus_name ? 'show' : 'hide'}`}>
				<p>
					{name.length<=50 ? 50-name.length+"/50" : 0} characters left
				</p>
			</div>
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
					type="text"
					placeholder="Phone Number"
					value={number}
					onChange={(e) => e.target.value.length<=11 && setNumber(e.target.value)}
					required
				/>
				<i className="bx bx-phone" />
			</div>
			<div className="input-box">
				<input
					type="text"
					placeholder="Address"
					value={address}
					onChange={(e) => setAddress(e.target.value)}
					required
				/>
				<i className="bx bx-map" />
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
			<div className="dropdown" >
				<select
					name="user"
					value={user_type}
					onChange={(e) => set_user_type(e.target.value)}
					required
				>
					<option value="" disabled>Select User Type</option>
					<option value="citizen">Citizen</option>
					<option value="worker">Worker</option>
				</select>
			</div>
			<button type="submit" className="button">Sign up</button>
		</form>
	);
}

export default SignupForm;

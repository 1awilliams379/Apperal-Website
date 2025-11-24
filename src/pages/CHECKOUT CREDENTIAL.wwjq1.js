import { authentication } from 'wix-members'
import wixLocation from 'wix-location';
import {session} from 'wix-storage';


var validRegex = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/

$w.onReady(function () {
	$w("#memberPasswordInput").inputType = "password";

	setEmailInput()
	setPassword()
	setUpMemberLogin()
	guestCheckout()
});

function setEmailInput() {
	$w('#memberEmailInput').onChange(() => {
		validateEmailInput($w('#memberEmailInput').value, $w('#memberErrorMessege'), $w('#memberEmailCheck'), $w('#memberLoginAndCheckoutButton'))
	})

	$w('#guestEmailInput').onChange(() => {
		validateEmailInput($w('#guestEmailInput').value, $w('#guestErrorText'), $w('#guestEmailChack'), $w('#guestCheckoutButton'))
	})
}

function validateEmailInput(input, error, check, button) {
 	

	if (!input.match(validRegex)) {
		error.expand()
		check.collapse()
		error.text = "PLEASE ENTER A VALID EMAIL"

	}
	else {
		check.expand()
		error.collapse()
	}
}

function setPassword() {
	$w('#memberPasswordShow').onClick(() => {
		$w('#memberPasswordInput').focus()
		if ($w('#memberPasswordShow').label === "SHOW") {
			$w('#memberPasswordShow').label = "HIDE"
			$w('#memberPasswordInput').inputType = "text";
		}
		else {
			$w('#memberPasswordShow').label = "SHOW"
			$w('#memberPasswordInput').inputType = "password";
		}
	})
}

function setUpMemberLogin() {
	$w('#memberLoginAndCheckoutButton').onClick(async () => {
  		const email = $w('#memberEmailInput').value;
  		const password = $w('#memberPasswordInput').value;

	try {
		await authentication.login(email, password);
		//console.log('Member is logged in');
		wixLocation.to("/checkout-steps")
	} 
	catch (error) {
		$w('#memberErrorMessege').expand()
		if (error.message === "authentication failed (-19976)") {
			$w('#memberErrorMessege').text = "The email or password are not valid.".toUpperCase()
		}
		else if (error.message === "Email is invalid.  (-19988)") {
			$w('#memberErrorMessege').text = "PLEASE ENTER A VALID EMAIL."
		}
		else if (error.message === "Password is too short (-19988)") {
			$w('#memberErrorMessege').text = "PASSWORD IS TOO SHORT."
		}
		else if (error.message === "Password is required (-19988)") {
			$w('#memberErrorMessege').text = "PASSWORD IS REQUIRED"
		}
		else if (error.message === "Email is empty.  (-19988)") {
			$w('#memberErrorMessege').text = "PLEASE ENTER A VALID EMAIL."
		}
		else {
			$w('#memberErrorMessege').text = error.message.toUpperCase()
		}
		console.log(error.message)
	}
});

}

function guestCheckout() {
	$w('#guestCheckoutButton').onClick(() => {
		if (($w('#guestEmailInput').value).match(validRegex)) {
			session.setItem("guestEmail", $w('#guestEmailInput').value);
			wixLocation.to("/checkout-steps")
		}
		else {
			$w('#guestErrorText').expand()
			$w('#guestErrorText').text = "PLEASE ENTER A VALID EMAIL"
		}
	})
	
}
// API Reference: https://www.wix.com/velo/reference/api-overview/introduction
import wixLocation from 'wix-location';

$w.onReady(function () {
	$w('#backToLoginButton').onClick(() => {
		wixLocation.to('/login-and-registration')
	})
});
import {local} from 'wix-storage';
import wixLocation from 'wix-location';
//import {accountIconSetUo} from 'public/sitewide'

let userCountry = local.getItem("userCountry");

$w.onReady(function () {
	if (userCountry) {
		//accountIconSetUo($w('#accountHoverName'), $w('#accountIconBox'), $w('#accountHoverMenu'))
	}
	else {
		wixLocation.to("/country-select")
	}
});


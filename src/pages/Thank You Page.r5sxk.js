import {session } from 'wix-storage'
import wixLocation from 'wix-location';

var orderNum

$w.onReady(function () {
	let details = session.getItem("hotOrder");
    let order = details.split('~')
	orderNum = order[0]
	$w('#orderNumberText').text = "ORDER NO. " + orderNum
	$w('#thankYouText').text = "​THANK YOU " + order[1].toUpperCase() + " FOR PLACING AN ORDER WITH RELENTLESS"
});

export function relentlessLogo_click(event) {
	wixLocation.to('/')
}

export function viewOrderButton_click(event) {
	session.removeItem("hotOrder")
	wixLocation.to(`/account/orders/${orderNum}`);
}

export function backHomeButton_click(event) {
	session.removeItem("hotOrder")
	wixLocation.to('/')
}
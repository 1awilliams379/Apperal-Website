import wixLocation from 'wix-location';

$w.onReady(function () {
	setupHover()
	setupOnClick()
});

function setupHover() {
	$w('#contactUsBox').onMouseIn(() => {
		$w('#contactUsBox').style.backgroundColor = "rgba(255,255,255,0.15)"
	})
	$w('#contactUsBox').onMouseOut(() => {
		$w('#contactUsBox').style.backgroundColor = "rgba(255,255,255,0.00)"
	})

	$w('#faqBox').onMouseIn(() => {
		$w('#faqBox').style.backgroundColor = "rgba(255,255,255,0.15)"
	})
	$w('#faqBox').onMouseOut(() => {
		$w('#faqBox').style.backgroundColor = "rgba(255,255,255,0.00)"
	})

	$w('#exchangesBox').onMouseIn(() => {
		$w('#exchangesBox').style.backgroundColor = "rgba(255,255,255,0.15)"
	})
	$w('#exchangesBox').onMouseOut(() => {
		$w('#exchangesBox').style.backgroundColor = "rgba(255,255,255,0.00)"
	})

	$w('#returnsBox').onMouseIn(() => {
		$w('#returnsBox').style.backgroundColor = "rgba(255,255,255,0.15)"
	})
	$w('#returnsBox').onMouseOut(() => {
		$w('#returnsBox').style.backgroundColor = "rgba(255,255,255,0.00)"
	})

	$w('#orderTrackingBox').onMouseIn(() => {
		$w('#orderTrackingBox').style.backgroundColor = "rgba(255,255,255,0.15)"
	})
	$w('#orderTrackingBox').onMouseOut(() => {
		$w('#orderTrackingBox').style.backgroundColor = "rgba(255,255,255,0.00)"
	})
}

function setupOnClick() {
	$w('#contactUsBox').onClick(() => {
		wixLocation.to("/contact-us")
	})

	$w('#faqBox').onClick(() => {
		wixLocation.to("/faq")
	})

	$w('#exchangesBox').onClick(() => {
		wixLocation.to("/exchanges")
	})

	$w('#returnsBox').onClick(() => {
		wixLocation.to("/returns")
	})

	$w('#orderTrackingBox').onClick(() => {
		wixLocation.to("/order-tracking")
	})
}
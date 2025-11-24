import wixWindow from 'wix-window';

$w.onReady(function () {
	let received = wixWindow.lightbox.getContext();
	$w('#checkoutHTML').allowFullScreen()
	$w('#checkoutHTML').src = received.link
});
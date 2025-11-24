// API Reference: https://www.wix.com/velo/reference/api-overview/introduction
// “Hello, World!” Example: https://learn-code.wix.com/en/article/1-hello-world

import wixWindow from 'wix-window';

$w.onReady(function () {

	adjustViews();
	// Write your JavaScript here

	// To select an element by ID use: $w('#elementID')

	// Click 'Preview' to run your code
});

function adjustViews() {
	if(wixWindow.formFactor === "Mobile") {
		$w('#mobileDescriptionSection').expand()
		$w('#mobileCompositionSection').expand()
	}
	else {
		$w('#mobileDescriptionSection').collapse()
		$w('#mobileCompositionSection').collapse()
	}
}
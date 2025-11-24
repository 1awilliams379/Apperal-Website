import wixLocation from 'wix-location';
import wixWindow from 'wix-window';

$w.onReady(function () {

	$w("#continueButton").onClick(() => {
		wixLocation.to("/country-select")
	})

	$w("#cancelButton").onClick(() => {
		wixWindow.lightbox.close();
	})
});

export function closeButton_click(event) {
  wixWindow.lightbox.close();
}



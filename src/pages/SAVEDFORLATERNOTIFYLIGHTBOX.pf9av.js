import wixLocation from 'wix-location';
import wixWindow from 'wix-window';

const languages = wixWindow.multilingual.siteLanguages

var backInStock = false, lowInStock = false
var selected

$w.onReady(function () {
    $w('#checkbox').selectedIndices = undefined
    selected = []

    var recieved = wixWindow.lightbox.getContext();
    //const car = recieved.cart
    var item = recieved.item
    var product = recieved.product

    $w('#itemImage').src = product.mediaItems[0].src

    console.log(item.notifications.backInStock,item.notifications.lowInStock )


    if (item.notifications.backInStock) {
        selected.push(0)
    }
    if (item.notifications.lowInStock) {
        selected.push(1)
    }

    $w('#checkbox').selectedIndices = selected

    $w("#submitButton").onClick(() => {
        wixWindow.lightbox.close({
            "backInStock": backInStock,
            "lowInStock": lowInStock
        });

    })
});

export function closeButton_click(event) {
    wixWindow.lightbox.close();
}

export function checkbox_change(event) {
	if ($w('#checkbox').selectedIndices.includes(0)) {
        backInStock = true
    }
    else {
        backInStock = false
    }
    if ($w('#checkbox').selectedIndices.includes(1)) {
        lowInStock = true
    }
    else {
        lowInStock = false
    }
}
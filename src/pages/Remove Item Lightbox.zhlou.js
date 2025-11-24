import { cart } from 'wix-stores';
import wixWindow from 'wix-window';
import {local} from 'wix-storage'
import wixPay from 'wix-pay';

import {setItemColor} from 'backend/products'


let userCountry = local.getItem("userCountry");
let userLanguage = local.getItem("userLanguage");
let currentCurrency, locale, currencyCode;

$w.onReady(function () {

	let recieved = wixWindow.lightbox.getContext();
	//const car = recieved.cart
	const item = recieved.item
	const index = recieved.index

	let split = userCountry.split('~')
    let lsplit = userLanguage.split('~')
    console.log(split, lsplit)
    locale = lsplit[1]
    currencyCode = split[3]

    let dollarUS = Intl.NumberFormat(locale, {
        //localeMatcher: "best fit"
        style: "currency",
        currency: currencyCode,
    });
    currentCurrency = dollarUS

	$w('#removeProductName').text = item.name
	$w('#removeProductImage').src = item.image
	$w('#sizeText').text = "SIZE: " + item.size
	setItemColor(item.sku)
        .then((color) => {
            $w('#colorTex').text = "Color: " + color.toUpperCase()
        })

	wixPay.currencies.currencyConverter.convertAmounts({
                    "amounts": [item.price],
                    "from": "USD",
                    "to": currencyCode
                })
                .then((cur) => {
                    $w("#removeProductPrice").text = currentCurrency.format(cur.amounts[0])
                })

	$w("#removeItemRemoveButton").onClick(() => {
		wixWindow.lightbox.close( {
				"send1": true
				});
		
	})
});

export function closeButton_click(event) {
  wixWindow.lightbox.close();
}



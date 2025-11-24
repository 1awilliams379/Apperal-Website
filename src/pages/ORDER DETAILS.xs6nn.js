import wixPay from 'wix-pay';
import { local, session } from 'wix-storage';
import { getPayMethodDetails, getChargeDetails } from 'backend/account.jsw'
import dateFormat, { masks } from "dateformat";
import { setItemColor } from 'backend/products'
import wixData from 'wix-data';

var order

let userCountry = local.getItem("userCountry");
let userLanguage = local.getItem("userLanguage");
let currentCurrency, locale, currencyCode;

$w.onReady(function () {
    setData()
});

function setData() {
    order = $w('#dynamicDataset').getCurrentItem()
    console.log(order)
    $w('#orderNumberText').text = order.orderNumber
    $w('#trackingText').text = order.fufillments.trackingInfo.trackingNumber
    $w('#statusText').text = order.status
    if (order.status === "Delivered") {
        $w('#dateDeliveredBox').expand()
        $w('#dateDeliveredText').text = dateFormat(order.fufillments.dateDelivered, "ddd mmm dS yyyy, h:MM:ss TT")
    }
    if (order.status === "Proccessing") {
        $w('#cancelOrderButton').expand()
    }
    $w('#dateOrderedText').text = dateFormat(order.fufillments.dateCreated, "ddd mmm dS yyyy, h:MM:ss TT")
    $w('#lastUpdateText').text = dateFormat(order._updatedDate, "ddd mmm dS yyyy, h:MM:ss TT")
    $w('#shippingNameText').text = order.shippingFirstName + " " + order.shippingLastName
    $w('#shippingAddressText').text = order.shippingAddress1
    if (order.shippingAddress2) {
        $w('#shippingAddressText').text = order.shippingAddress1 + "/n " + order.shippingAddress2
    }
    $w('#shippingCityStatePostalText').text = order.shippingCity + ", " + order.shippingState + " " + order.shippingPostalCode
    $w('#shippingPhoneText').text = order.shippingPhone
    $w('#shippingCountryText').text = order.shippingCountry
    $w('#deliveryMethodText').text = order.deliveryMethod
    $w('#billingNameText').text = order.billingFirstName + " " + order.billingLastName
    $w('#billingCityStatePostalText').text = order.billingCity + ", " + order.billingState + " " + order.billingPostalCode
    $w('#billingAddressText').text = order.shippingAddress1
    if (order.billingAddress2) {
        $w('#billingAddressText').text = order.billingAddress1 + "/n " + order.billingAddress2
    }
    $w('#billingCountryText').text = order.billingCountry
    $w('#billingPhoneText').text = order.billingPhone
    setPaymentColumn(order.chargeId)
    let split = userCountry.split('~')
    let lsplit = userLanguage.split('~')
    //console.log(split, lsplit)
    locale = lsplit[1]
    currencyCode = split[3]

    let dollarUS = Intl.NumberFormat(locale, {
        //localeMatcher: "best fit"
        style: "currency",
        currency: currencyCode,
    });
    currentCurrency = dollarUS
    wixPay.currencies.currencyConverter.convertAmounts({
            "amounts": [parseInt(order.subtotal), parseInt(order.shipping), parseInt(order.tax), parseInt(order.total)],
            "from": "USD",
            "to": currencyCode
        })
        .then((amounts) => {
            $w('#orderSubtotalText').text = currentCurrency.format(amounts.amounts[0])
            $w('#orderShippingTotalText').text = currentCurrency.format(amounts.amounts[1])
            $w('#orderTaxTotalTex').text = currentCurrency.format(amounts.amounts[2])
            $w('#orderTotalText').text = currentCurrency.format(amounts.amounts[3])
        })
    setRepeater()
    wixData.query("Invoices")
        .eq("orderNumber", order.orderNumber)
        .find()
        .then((res) => {
            var invoice = res.items[0]
            console.log(invoice)
            $w('#viewInvoiceButton').link = invoice.url
            $w('#viewInvoiceButton').target = "_blank"
        })
        .catch((err) => {
            console.log(err)
        })

}

async function setPaymentColumn(pid) {
    await getChargeDetails(pid)
        .then((intent) => {
            //console.log(intent)
            var mySentence = intent.payment_method_details.card.brand
            var type = mySentence.replace(/(^\w{1})|(\s+\w{1})/g, letter => letter.toUpperCase());
            var number = intent.payment_method_details.card.last4
            $w('#paymentTypeText').text = type
            $w('#paymentExpirationText').text = intent.payment_method_details.card.exp_month + "/" + intent.payment_method_details.card.exp_year
            if (type === "Amex") {
                $w('#paymentNumberText').text = "**** ****** *" + number
            } else {
                $w('#paymentNumberText').text = "**** **** **** " + number
            }
            $w('#paymentNameText').text = intent.billing_details.name
        })
}

function setRepeater() {
    const lineItems = order.lineItems.map((item, index) => {
        return {
            _id: getRandStr(10),
            item: item,
        }
    })
    console.log(lineItems)
    $w('#orderRepeater').data = lineItems
}

export function orderRepeater_itemReady($item, $itemData) {
    $item('#itemImage').src = $itemData.item.mediaItem.src
    $item('#itemNameText').text = $itemData.item.name
    $item('#itemSKUText').text = "SKU: " + $itemData.item.sku
    setItemColor($itemData.item.sku)
        .then((color) => {
            $item('#itemColorText').text = "Color: " + color
        })
    $item('#itemSizeText').text = "Size: " + $itemData.item.options[0].selection
    $item('#itemStatusText').text = order.status
    $item('#itemTrackingText').text = order.fufillments.trackingInfo.trackingNumber
    wixPay.currencies.currencyConverter.convertAmounts({
            "amounts": [parseInt($itemData.item.priceData.price)],
            "from": "USD",
            "to": currencyCode
        })
        .then((amounts) => {
            $item('#itemPriceText').text = currentCurrency.format(amounts.amounts[0])
        })
}

function getRandStr(length = 10) {
    return Math.random().toString(20).substr(2, length)
}
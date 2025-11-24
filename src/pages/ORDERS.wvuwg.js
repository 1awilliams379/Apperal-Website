import wixMembers from 'wix-members';
import { local } from 'wix-storage'
import wixData from 'wix-data';
import wixPay from 'wix-pay';
import wixLocation from 'wix-location';

import dateFormat, { masks } from "dateformat";

var member, memberDetails

let userCountry = local.getItem("userCountry");
let userLanguage = local.getItem("userLanguage");
let currentCurrency, locale, currencyCode;

$w.onReady(function () {
    member = $w('#dynamicDataset').getCurrentItem()
    console.log("mem", member)
    wixData.get("Members", member._id)
        .then((mem) => {
            memberDetails = mem
            console.log("mem dets", memberDetails)
            setData()
        })
})

async function setData() {
    let arr
    // for (var i in memberDetails.orders) {
    await wixData.query("Orders")
        .eq("stripeCustomerId", memberDetails.stripeId)
        .find()
        .then((ite) => {
            if (ite.items.length !== 0) {
                $w('#noOrdersPlacedBox').collapse()
                $w('#yourOrdersBox').expand()
                arr = ite.items.map((item) => {
                    return {
                        _id: item.orderNumber,
                        value: item
                    }
                })
                $w('#yourOrdersRepeater').data = arr
            } 
            else {return}

        })
    // }
    // console.log(arr)

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

}

export function yourOrdersRepeater_itemReady($item, $itemData) {
    $item('#orderNumberText').text = $itemData.value.orderNumber.toString()
    $item('#orderStatusText').text = $itemData.value.status
    $item('#dateOrderedText').text = dateFormat($itemData.value.fufillments.dateCreated, "ddd mmm dS yyyy, h:MM:ss TT")
    $item('#trackingNumberText').text = $itemData.value.fufillments.trackingInfo.trackingNumber
    wixPay.currencies.currencyConverter.convertAmounts({
            "amounts": [parseInt($itemData.value.total)],
            "from": "USD",
            "to": currencyCode
        })
        .then((amounts) => {
            $item('#priceText').text = currentCurrency.format(amounts.amounts[0])
        })
    $item('#orderNumberText').onClick(() => {
        wixLocation.to('/account/orders/' + $itemData.value.orderNumber.toString())
    })
}
import wixMembers from 'wix-members';
import { local } from 'wix-storage'
import wixData from 'wix-data';
import { getProduct, setItemColor } from 'backend/products'
import wixPay from 'wix-pay';
import wixStores from 'wix-stores';
import wixLocation from 'wix-location';
import wixWindow from 'wix-window';

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
            if (memberDetails.savedForLater.length !== 0) {
                $w('#noItemsBox').collapse()
                $w('#itemsSavedBox').expand()
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
                setData()
                setRepeater()
            }
        })
});

function setData() {
    $w('#numberOfItemsInListText').text = "YOU CURRENTLY HAVE " + memberDetails.savedForLater.length + " ITEMS IN YOUR LIST"
}

function setRepeater() {
    console.log("memagain", memberDetails)
    $w('#savedItemsRepeater').data = []
    let arr = []
    arr = memberDetails.savedForLater.map((item, index) => {
        return {
            _id: item.id + item.size + item.color,
            item: item
        }
    })
    $w('#savedItemsRepeater').data = arr
}

export function savedItemsRepeater_itemReady($item, $itemData, index) {
    console.log("ITEM DATA", $itemData)
    getProduct($itemData.item.id)
        .then((res) => {
            console.log(res)
            $item("#productImage").src = res.mediaItems[0].src
            $item('#productNAmeSizeText').text = res.name
            var price
            var color
            wixPay.currencies.currencyConverter.convertAmounts({
                    "amounts": [parseInt(res.price)],
                    "from": "USD",
                    "to": currencyCode
                })
                .then((amounts) => {
                    price = amounts.amounts[0]
                    $item('#productPriceColorText').text = currentCurrency.format(price)

                })
            setItemColor($itemData.item.sku)
                .then((col) => {
                    color = col
                })
            $item('#productImageBox').onClick(() => {
                // let baseUrl = wixLocation.baseUrl
                wixLocation.to(res.productPageUrl)
            })
            $item('#productImageBox').onMouseIn(() => {
                $item("#productPriceColorText").text = "Color: " + color
                $item('#productNAmeSizeText').text = "Size: " + $itemData.item.size
                if (res.mediaItems[1].src !== undefined) {
                    //$item("#productImage").src = res.mediaItems[1].src
                }
            })
            $item('#productImageBox').onMouseOut(() => {
                $item("#productPriceColorText").text = currentCurrency.format(price)
                $item('#productNAmeSizeText').text = res.name
                $item("#productImage").src = res.mediaItems[0].src
            })

            if (!res.inStock) {
                $item('#addToBagButton').disable()
                $item('#addToBagButton').label = "OUT OF STOCK"
            }

            $item('#notificationButton').onClick(() => {
                setRepeater()
                console.log($itemData.item, res)
                wixWindow.openLightbox("SAVEDFORLATERNOTIFYLIGHTBOX", { "item": $itemData.item, "product": res })
                    .then(async (data) => {
                        console.log("data returned", data)
                        var bis, lis
                        bis = data.backInStock
                        lis = data.lowInStock
                        var notify = {
                            "backInStock": bis,
                            "lowInStock": lis
                        }
                        memberDetails.savedForLater[index].notifications = notify
                        await wixData.update("Members", memberDetails)
                            .then((rese) => {
                                memberDetails = rese
                                console.log("NotificationUpdated", rese)
                            })
                            .catch((error) => {
                                console.log(error);
                            });
                    });
            })

            $item('#removeItemButton').onClick(() => {
                local.setItem("removeItem", "true")
                try {
                    wixStores.cart.removeProduct($itemData.item.id)
                } catch (error) {
                    local.setItem("removeItem", "false")
                    console.log(error)
                }
            })

            $item('#addToBagButton').onClick(() => {
                wixStores.cart.addProducts([{
                        "productId": $itemData.item.id,
                        "quantity": 1,
                        "options": {
                            "choices": {
                                Size: $itemData.item.size
                            }
                        }
                    }])
                    .then(() => {
                        console.log("product added");
                    })
                    .catch((error) => {
                        console.log(error);
                    });
            })

        })
        .catch((error) => {
            console.log(error)
        })
}
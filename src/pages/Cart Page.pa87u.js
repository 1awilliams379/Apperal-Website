import { cart } from 'wix-stores';
import wixLocation from 'wix-location';
import wixWindow from 'wix-window';
import wixPay from 'wix-pay';
import wixMembers from 'wix-members';
import { session, local } from 'wix-storage';

import { app } from "public/firebaseConfig";
import { setItemColor, addProductToSavedForLater } from 'backend/products'
import { getAuth } from 'firebase/auth'

let userCountry = local.getItem("userCountry");
let userLanguage = local.getItem("userLanguage");
let currentCart;
let currentCurrency, locale, currencyCode;

$w.onReady(function () {
    //wixLocation.queryParams.remove(["appSectionParams"]);
    return getCartDetails();
});

async function getCartDetails() {
    cart.getCurrentCart()
        .then((cartInfo) => {
            currentCart = cartInfo
            console.log(cartInfo)
            setTextDetails(cartInfo)
            setInfoRepeater(cartInfo)
            setCartRepeater(cartInfo)
            setPromitionalCode(cartInfo)
        })
        .catch((error) => {
            console.error(error);
        });
}

function setTextDetails(cartInfo) {
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
    wixPay.currencies.currencyConverter.convertAmounts({
            "amounts": [cartInfo.totals.subtotal, cartInfo.totals.tax, cartInfo.totals.total, cartInfo.totals.shipping, cartInfo.totals.discount],
            "from": "USD",
            "to": currencyCode
        })
        .then((cur) => {
            console.log(cur)
            $w('#subtotalPrice').text = currentCurrency.format(cur.amounts[0])
            $w('#TaxPrice').text = currentCurrency.format(cur.amounts[1])
            $w('#bagTotal').text = currentCurrency.format(cur.amounts[2])
            $w('#ShippingPrice').text = currentCurrency.format(cur.amounts[3])
            $w('#discountPrice').text = "-" + currentCurrency.format(cur.amounts[4])
        })
    const cartCount = cartInfo.lineItems.length.toString()
    $w('#orderSummaryText').text = "ORDER SUMMARY: " + `${cartCount}` + " ITEMS"
    $w('#currentCurrencyText').text = "CURRENCY: " + currencyCode

    $w('#continueShoppingContainer').onClick(() => {
        wixLocation.to("/ready-to-wear");
    })

    $w('#emptyBagContinueShopping').onClick(() => {
        wixLocation.to("/ready-to-wear");
    })

    $w('#promotionalCodeApply').onClick(() => {
        validatePromoCode()
    })

    $w('#proceedToCheckoutButton').onClick(() => {
        wixMembers.currentMember.getMember()
            .then((member) => {
                if (member) {
                    wixLocation.to("/checkout-steps")
                } else {
                    wixLocation.to("/checkout-credentials")
                }
            })
    })
}

function setInfoRepeater(cartInfo) {
    let arr = [{
            _id: "1",
            title: "PAYMENT",
            description: "payment bluff",
        },
        {
            _id: "2",
            title: "SHIPPING AND DELIVERY",
            description: "payment bluff",
        },
        {
            _id: "3",
            title: "RETURNS AND EXCHANGES",
            description: "return bluff",
        },
        {
            _id: "4",
            title: "PACKAGING",
            description: "package bluff",
        },
    ]
    $w('#repeater1').data = arr;
}

export function infoRepeater_itemReady($item, itemData, index) {
    const label = $item('#infoRepeaterTitle');
    const description = $item("#infoRepeaterDescription");
    const infoIcon = $item('#infoRepeaterImage');
    const popupIcon = $item('#infoRepeaterMoreIcon');

    label.text = itemData.title
    description.text = itemData.description

    // box.onClick(() => {

    // })
}

function getRandStr(length = 10) {
    return Math.random().toString(20).substr(2, length)
}

function setCartRepeater(cartInfo) {

    if (cartInfo.lineItems.length > 0) {
        $w('#cartWithItems').expand()
        $w('#cartWithoutItems').collapse()
        $w('#proceedToCheckoutButton').expand()

        var cartItems = []
        cartInfo.lineItems.map((item, index) => {
            var arr = [...Array(item.quantity).keys()]
            for (var _ in arr) {
                var obj = {
                    _id: getRandStr(10),
                    id: item.id,
                    name: item.name,
                    price: item.price,
                    size: item.options[0].selection,
                    sku: item.sku,
                    quan: item.quantity,
                    image: item.mediaItem.src,
                    productId: item.productId
                }
                cartItems.push(obj)
            }
        })

        $w('#repeater2').data = cartItems;
    } else {
        $w('#cartWithItems').collapse()
        $w('#cartWithoutItems').expand()
        $w('#proceedToCheckoutButton').collapse()
    }

}

export function repeater2_itemReady($item, itemData, index) {
    const title = $item('#cartRepeaterProductName');
    const price = $item('#cartRepeaterPrice');
    const discountPrice = $item('#cartRepeaterDiscountPrice');
    const size = $item('#cartRepeaterSize');
    const image = $item('#cartRepeaterItemImage');
    const color = $item('#cartRepeaterColor')
    var itemColor

    title.text = itemData.name;
    size.text = "SIZE: " + itemData.size
    image.src = itemData.image
    setItemColor(itemData.sku)
        .then((col) => {
            itemColor = col
            color.text = "COLOR: " + col.toUpperCase()
        })

    wixPay.currencies.currencyConverter.convertAmounts({
            "amounts": [itemData.price],
            "from": "USD",
            "to": currencyCode
        })
        .then((cur) => {
            price.text = currentCurrency.format(cur.amounts[0])
        })

    $item('#cartRepeaterProductNameBox').onClick(() => {
        let baseUrl = wixLocation.baseUrl
        var sk = itemData.sku.split("-")
        const locale = sk[0] + sk[1] + (sk[3].toLowerCase())
        console.log(locale)
        wixLocation.to(baseUrl + "/product/" + locale)

    })

    $item('#cartRepeaterItemImageBox').onClick(() => {
        let baseUrl = wixLocation.baseUrl
        var sk = itemData.sku.split("-")
        const locale = sk[0] + sk[1] + (sk[3].toLowerCase())
        console.log(locale)
        wixLocation.to(baseUrl + "/product/" + locale)
    })

    $item('#cartRepeaterRemoveItemBox').onClick(() => {
        //console.log(itemData)
        wixWindow.openLightbox("Remove Item Lightbox", { "item": itemData, "cart": currentCart, "index": index })
            .then((data) => {
                if (data.send1 === true) {
                    removed(index, itemData)
                }
            });

    });

    $item('#cartSaveForLaterButton').onClick(() => {
        //console.log(itemData)
        wixMembers.currentMember.getMember()
            .then((member) => {
                addProductToSavedForLater(itemData,member._id)
                    .then((res) => {
                        removed(index, itemData)
                    })
                    .catch((error) => {
                        console.log(error)
                    })
            })
            .catch((error) => {
                console.log(error)
            })
    })
}

function removed(index, $itemData) {
    try {
        if ($itemData.quan > 1) {
            cart.updateLineItemQuantity($itemData.id, ($itemData.quan - 1))
                .then((changedCart) => {
                    local.setItem("removeItem", "true")
                    setTextDetails(changedCart)
                    setCartRepeater(changedCart)
                })
        } else {
            cart.removeProduct($itemData.id)
                .then((changedCart) => {
                    local.setItem("removeItem", "true")
                    setTextDetails(changedCart)
                    setCartRepeater(changedCart)
                })
        }
    } catch (error) {
        console.log(error)
    }
}

function setPromitionalCode(cartItems) {
    $w('#promotionalCodeLabel').onClick(() => {

        $w('#promotionalCodeBox').collapsed ? $w('#promotionalCodeBox').expand() : $w('#promotionalCodeBox').collapse()
        $w('#promotionalCodeBox').collapsed ? $w('#vectorImage5').expand() : $w('#vectorImage5').collapse()
        $w('#promotionalCodeBox').collapsed ? $w('#vectorImage6').collapse() : $w('#vectorImage6').expand()
    })
}

function validatePromoCode() {
    const couponCode = $w('#promotionalCodeInput').value
    cart.applyCoupon(couponCode)
        .then((updatedCart) => {
            const couponDiscount = updatedCart.appliedCoupon.discountValue;
            wixPay.currencies.currencyConverter.convertAmounts({
                    "amounts": [updatedCart.totals.total, parseInt(couponDiscount)],
                    "from": "USD",
                    "to": currencyCode
                })
                .then((cur) => {
                    $w('#bagTotal').text = currentCurrency.format(cur.amounts[0])
                    $w('#discountPrice').text = "-" + currentCurrency.format(cur.amounts[1])
                })

            setCartRepeater(updatedCart)
        })
        .catch((error) => {
            console.error(error);
        });

}
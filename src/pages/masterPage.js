import { app } from "public/firebaseConfig";
// const firebaseConfig = {
//     apiKey: "AIzaSyDXuFouMhVCavQyzPWk-Al1xu7fSqgc8YQ",
//     authDomain: "relentlessbtl.firebaseapp.com",
//     databaseURL: "https://relentlessbtl-default-rtdb.firebaseio.com",
//     projectId: "relentlessbtl",
//     storageBucket: "relentlessbtl.appspot.com",
//     messagingSenderId: "66156275759",
//     appId: "1:66156275759:web:e995da5cf635aae937beda",
//     measurementId: "G-ZXQYTJWH4H"
// };

// try {
//     export const app = initializeApp(firebaseConfig);
// } catch (error) {
//     console.log(error)
// }
export const firebaseAuth = getAuth();

import { local, session } from 'wix-storage';
import wixLocation from 'wix-location';
import wixMembers from 'wix-members';
import wixData from 'wix-data';
import wixStores from 'wix-stores';
import wixPay from 'wix-pay';

import { getAuth, signOut, onAuthStateChanged } from "firebase/auth";

import { setItemColor, setCurrency } from 'backend/products'

let previousPageURL;

let fadeOptions = {
    "duration": 250,
    "delay": 0,
    "direction": "top"
};

let dollarUS

let userCountry = local.getItem("userCountry");
let userLanguage = local.getItem("userLanguage");
let currentCurrency, locale, currencyCode;
let checkoutCountry = false

$w.onReady(function () {
    local.setItem("removeItem", "false")
    // wixMembers.currentMember.getMember()
    //     .then((membe) => {
    if (local.getItem("userCountry") && local.getItem("userLanguage")) {
        let split = userCountry.split('~')
        let country = split[1]
        $w('#countrySelectText').text = "SHIP TO: " + (country.toUpperCase())
        $w('#countrySelectBox').onClick(() => {
            wixLocation.to("/country-select")
        })
    } else {
        wixLocation.to("/country-select")
    }
    // }
    // })

    setUp()

    // previousPageURL = session.getItem("page");
    // session.setItem("page", wixLocation.url);
});

async function setUp() {
    let split = userCountry.split('~')
    let lsplit = userLanguage.split('~')
    //console.log(split, lsplit)
    locale = lsplit[1]
    currencyCode = split[3]

    dollarUS = Intl.NumberFormat(locale, {
        //localeMatcher: "best fit"
        style: "currency",
        currency: currencyCode,
    });
    currentCurrency = dollarUS
    $w('#accountHoverLogOutButton').onClick(() => {
        const auth = getAuth();
        signOut(auth).then(() => {
            wixMembers.authentication.logout()
            console.log('logged out')
            wixLocation.to('/login-and-registration')
        }).catch((error) => {
            console.log(error)
        });
    })

    // wixMembers.authentication.onLogout(() => {

    // });
    accountIconSetUo()
    wixStores.cart.getCurrentCart()
        .then((cart) => {
            cartSetup(cart)
        })
        .catch((error) => {
            console.log("CART UNAVAILABLE")
            cartSetup(undefined)
        })

}

async function accountIconSetUo() {
    wixMembers.currentMember.getMember()
        .then((member) => {
            if (member) {
                setAccountHover(member.contactDetails.firstName + " " + member.contactDetails.lastName)
                onAuthStateChanged(firebaseAuth, (user) => {
                    user = firebaseAuth.currentUser
                    console.log("firebase user", user)
                    if (user) {
                        // ...
                    } else {
                        console.log("nullUser")

                    }
                });
            } else {
                setUpGuestFunctions()
            }

            $w('#shoppingBagMenuCheckoutButton').onClick(() => {
                if (member) {
                    wixLocation.to("/checkout-steps")
                } else {
                    wixLocation.to("/checkout-credentials")
                }
            })
        })
}

function setAccountHover(member) {
    $w('#accountHoverName').text = member
    $w('#accountIconBox').onClick(() => {
        wixLocation.to('/account')
    })

    $w('#accountIconBox').onMouseIn(() => {
        $w('#menuShadeContainer').show()
        $w('#accountHoverMenu').show()
    })

    $w('#accountHoverMenu').onMouseOut((event) => {
        let offsetY = event.offsetY;
        let offsetX = event.offsetX;
        if (!(offsetY < 3 && (offsetX > 160 && offsetX < 186) && offsetY > -22)) {
            $w('#accountHoverMenu').hide()
            $w('#menuShadeContainer').hide()
        } else {
            $w('#menuShadeContainer').show()
            $w('#accountHoverMenu').show()
        }
    })
    $w('#accountIconBox').onMouseOut((event) => {
        let offsetY = event.offsetY;
        let offsetX = event.offsetX;
        if ((offsetX < 0 && !(offsetY > 22)) || (offsetX > 22 && !(offsetY > 22)) || offsetY < 0) {
            $w('#accountHoverMenu').hide()
            $w('#menuShadeContainer').hide()
        } else {
            $w('#menuShadeContainer').show()
            $w('#accountHoverMenu').show()
        }
    })
}

function setUpGuestFunctions() {
    $w('#accountIconBox').onClick(() => {
        wixLocation.to('/login-and-registration')
    })
}

var yBottom = 559

function cartSetup(cart) {
    //console.log(cart)
    setShoppingBagMenuCart(cart)
    $w('#shoppingCartIcon1').onMouseIn((event) => {
        $w('#menuShadeContainer').show()
        $w('#cartSummary').show()
    })

    $w('#cartSummary').onMouseOut((event) => {
        let offsetY = event.offsetY;
        let offsetX = event.offsetX;
        //console.log(offsetX, offsetY)

        if (!(offsetY < yBottom && ((offsetX > 0 && offsetX < 340 && offsetY > 50) || (offsetX > 375 && offsetX < 400 && offsetY > 50) || (offsetX > 340 && offsetX < 375 && offsetY > 35 && offsetY < 51)))) {
            $w('#cartSummary').hide()
            $w('#menuShadeContainer').hide()
        } else {
            $w('#menuShadeContainer').show()
            $w('#cartSummary').show()
        }
    })
    $w('#shoppingCartIcon1').onMouseOut((event) => {
        let offsetY = event.offsetY;
        let offsetX = event.offsetX;
        //.log(offsetX, offsetY)
        if ((offsetX < -5 && !(offsetY > 18)) || (offsetX > 15 && !(offsetY > 18)) || offsetY < 0) {
            $w('#cartSummary').hide()
            $w('#menuShadeContainer').hide()
        } else {
            $w('#menuShadeContainer').show()
            $w('#cartSummary').show()
        }
    })

    wixStores.cart.onChange((changedCart) => {
        local.getItem("removeItem")
        if (local.getItem("removeItem") === "false") {
            setShoppingBagMenuCart(changedCart, "ITEM ADDED TO BAG")
            $w('#menuShadeContainer').show()
            $w('#cartSummary').show("slide", fadeOptions)
                .then(() => {
                    $w('#cartSummary').hide("slide", {
                            "duration": 250,
                            "delay": 4000,
                            "direction": "top"
                        })
                        .then(() => {
                            $w('#menuShadeContainer').hide()
                            setShoppingBagMenuCart(changedCart)
                        })
                })
        } else {
            local.setItem("removeItem", "false")
            setShoppingBagMenuCart(changedCart)
        }
    });
}

function setShoppingBagMenuCart(cart, headText) {
    if (!cart) {
        yBottom = 147
        $w('#shoppingBagMenuTitle').text = "YOUR SHOPPING BAG IS EMPTY"
        $w('#shoppingBagMenuCartItemsBox').collapse()
        return
    }
    if (cart.lineItems.length == 0) {
        yBottom = 147
        $w('#shoppingBagMenuTitle').text = "YOUR SHOPPING BAG IS EMPTY"
        $w('#shoppingBagMenuCartItemsBox').collapse()
        return
    } else {
        $w('#shoppingBagMenuCartItemsBox').expand()
        var sumTotal = 0
        for (var index in cart.lineItems) {
            sumTotal += cart.lineItems[index].quantity
        }

        if (sumTotal === 1) {

        } else {
            yBottom = 559
        }

        var itemsInCart = []
        cart.lineItems.map((item, index) => {
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
                    src: item.mediaItem.src
                }
                itemsInCart.push(obj)
            }
        })

        $w('#shoppingBagMenuRepeater').data = itemsInCart

        wixPay.currencies.currencyConverter.convertAmounts({
                "amounts": [cart.totals.subtotal],
                "from": "USD",
                "to": currencyCode
            })
            .then((amounts) => {
                $w('#shoppingBagMenuSubtotalText').text = currentCurrency.format(amounts.amounts[0])
            })
        if (headText) {
            $w('#shoppingBagMenuTitle').text = "ITEM ADDED TO BAG"
        } else {
            $w('#shoppingBagMenuTitle').text = "SUMMARY (" + sumTotal.toString() + ")"
        }
    }

}

export function shoppingBagMenuRepeater_itemReady($item, $itemData) {
    wixPay.currencies.currencyConverter.convertAmounts({
            "amounts": [parseInt($itemData.price)],
            "from": "USD",
            "to": currencyCode
        })
        .then((amounts) => {
            $item('#shoppingBagMenuItemPrice').text = currentCurrency.format(amounts.amounts[0])

        })
    $item('#shoppingBagMenuItemNameText').text = $itemData.name
    $item('#shoppingBagMenuItemSize').text = "Size: " + $itemData.size
    $item('#shoppingBagMenuItemImage').src = $itemData.src
    setItemColor($itemData.sku)
        .then((color) => {
            $item('#shoppingBagMenuItemColor').text = "Color: " + color
        })
    $item('#shoppingBagMenuCurrencyLabel').text = "CURRENCY: " + currencyCode

    $item('#shoppingBagMenuRemoveItemButton').onClick(() => {
        local.setItem("removeItem", "true")
        try {
            if ($itemData.quan > 1) {
                wixStores.cart.updateLineItemQuantity($itemData.id, ($itemData.quan - 1))
            } else {
                wixStores.cart.removeProduct($itemData.id)
            }
        } catch (error) {
            local.setItem("removeItem", "false")
            console.log(error)
        }
    })
}

function getRandStr(length = 10) {
    return Math.random().toString(20).substr(2, length)
}
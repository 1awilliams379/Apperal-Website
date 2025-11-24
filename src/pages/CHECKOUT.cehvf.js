import { currentMember } from 'wix-members';
import { cart } from 'wix-stores';
import { session, local } from 'wix-storage';
import wixData from 'wix-data';
import wixLocation from 'wix-location';
import wixWindow from 'wix-window';
import wixPay from 'wix-pay';
import { autocomplete, placeDetails } from 'backend/gmapsapi';
import { addressVerification, parcelCreation, shipmentCreation, createUPS, createFedex, retrieveCarriers, transactionCreation } from 'backend/shippo';
import { retrievePayMethod } from 'backend/account'
import { usStates, phoneCountryCodes, brazilStates, canadaStates, indiaStates, setAutocompleteSelection } from "public/shippingBack"
import { chargePI, charge, createOrder, getProductVariants, decrementInventory } from 'backend/checkout'
import { formReturn } from 'backend/anvil'
import { createToken, encodeCard } from "public/stripeAPI";
import { sendEmail, sendOrderConfirmationToCustomer } from 'backend/sendGrid';
import { setItemColor } from 'backend/products'
//import { changeTextColor } from 'public/sitewide'

let accountFirstName, accountLastName, accountEmail, accountPhone
let shippingCarrier, shippingLoginEmail, shippingFirstName, shippingLastName, shippingPhoneNumber, shippingPhoneNumberNoCode, shippingPhoneNumberCountryCode, shippingStreet, shippingAddy2, shippingCity, shippingState, shippingCountry, shippingPostalCode;
let billingLoginEmail, billingFirstName, billingLastName, billingPhoneNumber, billingPhoneNumberNoCode, billingPhoneNumberCountryCode, billingStreet, billingAddy2, billingCity, billingState, billingCountry, billingPostalCode;
let loggedIn, curMember, memberDetails;
let id;
let currentCart;
let customerShippingAddressId, customerShippingParcelsArray, shippingCarrierArray, customerShippingParcelIdArray;
let payMethod;
var paymentItem
let payWithCard = "CREDIT/DEBIT CARD",
    payWithPayPal = "PAYPAL",
    payWithGoogle = "GOOGLE PAY"
let deliveryOption = "STANDARD"
let standardDelivery = "STANDARD",
    expressDelivery = "EXPRESS",
    nextDayDelivery = "NEXTDAY"
let shipment
let selectedRate;
let billingSameAsShipping = true

let userCountry = local.getItem("userCountry");
let userLanguage = local.getItem("userLanguage");
let currentCurrency, locale, currencyCode;

const countriesWithStatesAndRegions = ["US", "BR", "CA", "CN", "ET", "FM", "FR", "DE", "IN", "ID", "IT", "JP", "MM", "MX", "NG", "PW", "RU", "SS", "ZA", "ES", /*"GB",*/ "VN"];

let fadeOptions = {
    "duration": 250,
    "delay": 0,
    "direction": "top"
};

$w.onReady(function () {
    // generateToken()
    // .then((res) => {
    //     console.log(res)
    // })
    //formReturn()
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
    shippingCarrierArray = []
    setOrderSummary()
    // createUPS()
    //     .then((carrier) => {
    //         console.log(carrier)
    //         shippingCarrierArray.push(carrier.object_id)
    //     })
    // createFedex()
    //     .then((carrier) => {
    //         console.log(carrier)
    //         shippingCarrierArray.push(carrier.object_id)
    //     })
});

function setOrderSummary() {
    cart.getCurrentCart()
        .then((cartInfo) => {
            setData()
            console.log(cartInfo)
            currentCart = cartInfo
            let cartLength = currentCart.lineItems.length
            var sumTotal = 0
            for (var index in currentCart.lineItems) {
                sumTotal += currentCart.lineItems[index].quantity
            }
            if (sumTotal > 1) {
                $w('#numberOfItemsText').text = sumTotal + " ITEMS"
            } else {
                $w('#numberOfItemsText').text = sumTotal + " ITEM"
            }
            wixPay.currencies.currencyConverter.convertAmounts({
                    "amounts": [currentCart.totals.subtotal, currentCart.totals.discount],
                    "from": "USD",
                    "to": currencyCode
                })
                .then((amounts) => {
                    $w('#promoDiscountPrice').text = currentCurrency.format(amounts.amounts[1])
                    $w('#orderSummaryTotal').text = currentCurrency.format(amounts.amounts[0] - amounts.amounts[1])
                })
            setOrderSummaryRepeater(currentCart)
        })
        .catch((error) => {
            wixLocation.to('/')
            console.error(error);
        });

    $w('#orderSummaryEditBag').onClick(() => {
        wixLocation.to('/cart-page?appSectionParams=%7B"origin"%3A"cart-popup"%7D')
    })

    $w('#orderSummaryExpandButton').onClick(() => {
        $w('#orderSummaryExpandButton').collapse()
        $w('#orderSummaryCollapseButton').expand()
        $w('#orderSummaryDetailsBox').expand()
        //$w('#orderSummaryDetailsBox').show("slide", fadeOptions)

    })
    $w('#orderSummaryCollapseButton').onClick(() => {
        $w('#orderSummaryCollapseButton').collapse()
        $w('#orderSummaryExpandButton').expand()
        $w('#orderSummaryDetailsBox').collapse()
        //$w('#orderSummaryDetailsBox').hide("slide", fadeOptions)

    })

}

function setOrderSummaryRepeater(cucart) {
    var cartItems = []
    cucart.lineItems.map((item, index) => {
        var arr = [...Array(item.quantity).keys()]
        for (var _ in arr) {
            var obj = {
                _id: item.id.toString(),
                price: item.price,
                name: item.name,
                image: item.mediaItem.src,
                size: item.options[0].selection,
                sku: item.sku,
            }
            cartItems.push(obj)
        }
    })
    $w('#orderSummaryRepeater').data = cartItems

}

export function orderSummaryRepeater_itemReady($item, $itemData) {
    $item('#orderSummaryProdctImage').src = $itemData.image
    $item('#orderSummaryProductName').text = $itemData.name.toUpperCase()
    $item('#orderSummaryProductSize').text = "SIZE: " + $itemData.size.toUpperCase()
    setItemColor($itemData.sku)
        .then((color) => {
            $item('#orderSummaryProductColor').text = "COLOR: " + color.toUpperCase()
        })
    wixPay.currencies.currencyConverter.convertAmounts({
            "amounts": [$itemData.price],
            "from": "USD",
            "to": currencyCode
        })
        .then((amounts) => {
            $item('#orderSummaryProductPrice').text = currentCurrency.format(amounts.amounts[0])
        })
}

function setData() {
    let startcountry = local.getItem("userCountry");
    shippingCountry = startcountry.split('~')
    if (countriesWithStatesAndRegions.includes(shippingCountry[0])) {
        $w('#shippingStateDropdown').expand()
        $w('#shippingStateText').expand()
    }

    if (shippingCountry[0] !== "US") { layoutBasedOffCoutntry() }

    currentMember.getMember('FULL')
        .then((member) => {
            loggedIn = member ? true : false;
            curMember = member
            if (loggedIn) {
                id = member._id;
                wixData.get("Members", id)
                    .then((results) => {
                        console.log(results)
                        memberDetails = results
                        accountFirstName = results.contactDetails.firstName
                        accountLastName = results.contactDetails.lastName
                        accountEmail = results.email
                        accountPhone = results.contactDetails.phoneNumber
                        shippingFirstName = results.contactDetails.firstName;
                        shippingLastName = results.contactDetails.lastName;
                        shippingPhoneNumber = results.contactDetails.phoneNumber
                        shippingLoginEmail = results.email;
                        setShipping()

                    })
            } else {
                shippingLoginEmail = session.getItem("guestEmail");
                $w('#clientEmailLabel').text = shippingLoginEmail
                setShipping()
            }

        })
        .catch((error) => {
            console.error(error);
        });

    $w('#clientInformationEditButton').onClick(() => {
        wixLocation.to("/checkout-credentials")
    })
}

function layoutBasedOffCoutntry() {
    if (shippingCountry[0] === "IN") {
        $w('#shippingAddressLine2Box').collapse()
        $w('#addressCityTextLabel').text = "AREA, COLONY, STREET, SECTOR, VILLAGE/TOWN/CITY*"
        $w('#shippingPostalCodeTextLabel').text = "PINCODE*"
    }
}

function setShipping() {
    retrieveCarriers()
        .then((res) => {
            shippingCarrierArray = res
            console.log(res)
        })

    if (countriesWithStatesAndRegions.includes(shippingCountry[0])) {
        setStateDropdown()
    }

    setPhoneDropdown()

    let countryName = shippingCountry[1].toUpperCase()
    $w('#currentShippingLocationText').text = "​YOU ARE CURRENTLY SHIPPING TO " + (countryName)
    $w('#shippingCountryDropdown').options = [{ "label": countryName, "value": countryName }]
    $w('#clientEmailLabel').text = shippingLoginEmail
    $w('#shippingFirstNameInput').value = shippingFirstName
    $w('#shippingLastNameTextInput').value = shippingLastName
    $w('#shippingPhoneNumberInput').value = shippingPhoneNumber

    if (memberDetails.contactDetails.addresses.choices.length !== 0) {
        setUpSavedAddressRepeater()

    }

    $w('#viewDeliveryOptionsButton').onClick(async () => {
        if ($w('#savedAddressDifferentAddressRadioGroup').selectedIndex === undefined) {
            $w('#savedAddressRepeater').forEachItem(($item, itemData, index) => {
                if ($item('#savedAddressRadioGroup').selectedIndex !== undefined) {
                    shippingFirstName = itemData.address.firstName
                    shippingLastName = itemData.address.lastName
                    shippingStreet = itemData.address.line1
                    shippingAddy2 = itemData.address.line2
                    shippingCity = itemData.address.city
                    shippingState = itemData.address.state
                    shippingPostalCode = itemData.address.postal
                    shippingPhoneNumberNoCode = itemData.address.phoneNumber
                    shippingPhoneNumberCountryCode = itemData.address.phoneCountryCode
                    shippingPhoneNumber = itemData.address.phoneCountryCode + itemData.address.phoneNumber
                    continueShipping()
                }
            })
        } else {
            $w('#shippingFirstNameErrorText').collapse()
            $w('#shippingLastNameErrorText').collapse()
            $w('#shippingAddressErrorTextBox').collapse()
            $w('#shippingPostalCodeErrorText').collapse()
            $w('#shippingStateErrorText').collapse()
            $w('#shippingCityErrorText').collapse()
            $w('#shippingPhoneNumberErrorTextInput').collapse()
            if ($w('#shippingFirstNameInput').value === "") {
                $w('#shippingFirstNameErrorText').expand()
                $w('#shippingFirstNameErrorText').text = "FIRST NAME IS REQUIRED"
            }
            if ($w('#shippingLastNameTextInput').value === "") {
                $w('#shippingLastNameErrorText').expand()
                $w('#shippingLastNameErrorText').text = "LAST NAME IS REQUIRED"
            }
            if ($w('#shippingAddressInput').value === "") {
                $w('#shippingAddressErrorTextBox').expand()
                $w('#shippingAddressErrorTextBox').text = "ADDRESS IS REQUIRED"
            }
            if ($w('#shippingCityInput').value === "") {
                $w('#shippingCityErrorText').expand()
                $w('#shippingCityErrorText').text = "CITY IS REQUIRED"
            }
            if ($w('#shippingPostalCodeInput').value === "") {
                $w('#shippingPostalCodeErrorText').expand()
                $w('#shippingPostalCodeErrorText').text = "POSTAL CODE IS REQUIRED"
            }
            if ($w('#shippingStateDropdown').selectedIndex === undefined) {
                $w('#shippingStateErrorText').expand()
                $w('#shippingStateErrorText').text = "STATE/REGION IS REQUIRED"
            }
            if ($w('#shippingPhoneNumberInput').value === "") {
                $w('#shippingPhoneNumberErrorTextInput').expand()
                $w('#shippingPhoneNumberErrorTextInput').text = "STATE/REGION IS REQUIRED"
            }
            if (!$w('#shippingStateErrorText').collapsed ||
                !$w('#shippingPostalCodeErrorText').collapsed ||
                !$w('#shippingCityErrorText').collapsed ||
                !$w('#shippingAddressErrorTextBox').collapsed ||
                !$w('#shippingLastNameErrorText').collapsed ||
                !$w('#shippingFirstNameErrorText').collapsed ||
                !$w('#shippingPhoneNumberErrorTextInput').collapsed) {
                return
            } else {
                shippingFirstName = $w('#shippingFirstNameInput').value
                shippingLastName = $w('#shippingLastNameTextInput').value
                shippingStreet = $w('#shippingAddressInput').value
                shippingAddy2 = $w('#shippingAddress2Input').value
                shippingCity = $w('#shippingCityInput').value
                shippingState = $w('#shippingStateDropdown').options[$w('#shippingStateDropdown').selectedIndex].label
                shippingPostalCode = $w('#shippingPostalCodeInput').value
                shippingPhoneNumberNoCode = $w('#shippingPhoneNumberInput').value
                shippingPhoneNumberCountryCode = $w('#shippingPhoneAreaDropdown').options[$w('#shippingPhoneAreaDropdown').selectedIndex].label
                shippingPhoneNumber = $w('#shippingPhoneAreaDropdown').options[$w('#shippingPhoneAreaDropdown').selectedIndex].label + $w('#shippingPhoneNumberInput').value

                continueShipping()
            }
        }

    })
}

async function continueShipping() {
    let shipcountry = shippingCountry[1]
    customerShippingParcelIdArray = []
    customerShippingParcelsArray = []
    await addressVerification(shippingFirstName, shippingLastName, shippingStreet, shippingCity, shippingState, shipcountry, shippingPostalCode, shippingLoginEmail, shippingPhoneNumberNoCode)
        .then((res) => {
            console.log(res)
            if (res.validation_results.is_valid || res.test) {
                customerShippingAddressId = res.object_id
                cart.getCurrentCart()
                    .then((currentCart) => {
                        const cartId = currentCart._id;
                        const cartLineItems = currentCart.lineItems;
                        for (var item in cartLineItems) {
                            let weight = cartLineItems[item].weight
                            let sku = cartLineItems[item].sku
                            parcelCreation(sku, weight, cartLineItems[item].price)
                                .then((parres) => {
                                    var arr = ""
                                    arr = parres.object_id
                                    customerShippingParcelsArray.push(parres)
                                    customerShippingParcelIdArray.push(arr)
                                    if (customerShippingParcelsArray.length === cartLineItems.length) {
                                        shipmentCreation(customerShippingAddressId, customerShippingParcelsArray, shippingCarrierArray, res, customerShippingParcelsArray)
                                            .then((res) => {
                                                console.log(res)
                                                shipment = res
                                                $w('#viewDeliveryOptionsButton').collapse()
                                                $w('#editShippingAddressButton').expand()
                                                setUpDeliver(res)
                                            })
                                    }
                                })
                        }

                    })
                    .catch((error) => {
                        console.error(error);
                    });
            }
        })
}

function setUpSavedAddressRepeater() {

    setSavedAddressRepeater()
    //$w('#savedAddressRadioGroup')

}

function setSavedAddressRepeater() {
    $w('#savedAddressRepeater').data = []
    $w('#savedAddressDifferentCountryRepeater').data = []
    var addys = []
    var diffAddys = []
    memberDetails.contactDetails.addresses.choices.map((item, index) => {
        var key = Object.keys(item)[0]
        var obj = {
            _id: key,
            address: item[key]
        }
        if (item[key].country === shippingCountry[0]) {
            addys.push(obj)
        } else {
            diffAddys.push(obj)
        }
    })

    console.log(addys)

    if (addys.length === 0) {
        //
    } else {
        $w('#savedAddressBox').expand()
        $w('#shippingBox').collapse()
        $w('#savedAddressDifferentCountryRepeater').data = diffAddys
        $w('#savedAddressRepeater').data = addys

    }
}

export function savedAddressRepeater_itemReady($item, $itemData, index) {
    if (index === 0) {
        $item('#savedAddressRadioGroup').selectedIndex = 0
    }
    $item('#savedAddressTitle').text = $itemData._id
    if ($itemData.line2) {
        $item('#savedAddressAddressText').text = $itemData.address.line1 + " " + $itemData.address.line2 + " " + $itemData.address.city + " " + $itemData.address.state + " " + $itemData.address.postal
    } else {
        $item('#savedAddressAddressText').text = $itemData.address.line1 + " " + $itemData.address.city + " " + $itemData.address.state + " " + $itemData.address.postal
    }

    $item('#savedAddressRadioGroup').onChange(() => {
        if ($item('#savedAddressRadioGroup').selectedIndex === 0) {
            $w('#shippingBox').collapse()
            $w('#savedAddressDifferentAddressRadioGroup').selectedIndex = undefined
        }
    })
}

export function savedAddressDifferentCountryRepeater_itemReady($item, $itemData) {
    $item('#savedAddressDifferentCountryTitle').text = $itemData._id
    if ($itemData.line2) {
        $item('#savedAddressDifferentCountryAddress').text = $itemData.address.line1 + " " + $itemData.address.line2 + " " + $itemData.address.city + " " + $itemData.address.state + " " + $itemData.address.postal
    } else {
        $item('#savedAddressDifferentCountryAddress').text = $itemData.address.line1 + " " + $itemData.address.city + " " + $itemData.address.state + " " + $itemData.address.postal
    }
}

export function savedAddressDifferentAddressRadioGroup_change(event) {
    if ($w('#savedAddressDifferentAddressRadioGroup').selectedIndex !== undefined) {
        $w('#shippingBox').expand()
        $w('#savedAddressRepeater').forEachItem(($item, itemData, index) => {
            $item('#savedAddressRadioGroup').selectedIndex = undefined
        })
    }
}

function setPhoneDropdown() {
    let arr = phoneCountryCodes.map((item, index) => {
        return {
            label: "+" + item.code,
            value: item.name
        }
    })
    $w('#shippingPhoneAreaDropdown').options = arr

    for (var country in arr) {
        if (shippingCountry[1] === arr[country].value) {
            let index = parseInt(country)
            $w('#shippingPhoneAreaDropdown').selectedIndex = index
            break
        }
    }

}

function getRandStr(length = 10) {
    return Math.random().toString(20).substr(2, length)
}

export function shippingAddressInput_input(event) {
    autocomplete($w('#shippingAddressInput').value, (shippingCountry[0].toLowerCase()), "address")
        .then((res) => {
            //console.log(res)
            let predictions = res.predictions; // For simplicity we put the predictions in a new variable
            let suggestions = []; // We should create an empty array for the suggestions
            predictions.forEach(function (prediction) {
                let item = { "_id": getRandStr(), "address": prediction.description, "placeId": prediction.place_id };
                suggestions.push(item);
            });
            //console.log(res)
            $w("#shippingAddressRepeater").data = []; // clear the repeater contents
            $w("#shippingAddressRepeater").data = suggestions; // add the new suggestions to the repeater
            $w("#shippingAddressRepeater").expand(); // Repeater is full now, let's show it.

        })
}

function zipCodeReturn(placeId) {

}

export function shippingAddressRepeater_itemReady($item, itemData, index) {
    let fullAddy = itemData.address;
    $item("#shippingAddressRepeaterText").text = ""
    placeDetails(itemData.placeId)
        .then((res) => {
            let addresscomponentsArr = []
            let zipCode;
            addresscomponentsArr = res.result.address_components
            //console.log(addresscomponentsArr)
            for (var key in addresscomponentsArr) {
                if ((addresscomponentsArr[key].types.includes('postal_code'))) {
                    zipCode = addresscomponentsArr[key].short_name

                }
            }
            if (!zipCode) {
                zipCode = ""
            } else {
                fullAddy = fullAddy + ", " + zipCode;
            }

            $item("#shippingAddressRepeaterText").text = fullAddy;

        })
    //console.log(itemData)

    $item("#shippingAddressRepeaterText").onClick((event) => {
        $w('#shippingFirstNameErrorText').collapse()
        $w('#shippingLastNameErrorText').collapse()
        $w('#shippingAddressErrorTextBox').collapse()
        $w('#shippingPostalCodeErrorText').collapse()
        $w('#shippingStateErrorText').collapse()
        $w('#shippingCityErrorText').collapse()
        $w('#shippingPhoneNumberErrorTextInput').collapse()
        $w('#shippingAddressInput').value = undefined
        $w("#shippingCityInput").value = undefined
        $w('#shippingPostalCodeInput').value = undefined
        //console.log(setAutocompleteSelection(fullAddy))
        let addyarr = setAutocompleteSelection(fullAddy, shippingCountry[1])
        $w('#shippingAddressInput').value = addyarr.line1;
        $w('#shippingAddress2Input').value = addyarr.line2
        $w("#shippingCityInput").value = addyarr.city;
        if (countriesWithStatesAndRegions.includes(shippingCountry[0])) {
            autocompleteStateDropdown(addyarr.state)
        }
        $w('#shippingPostalCodeInput').value = addyarr.postal
        // let split = fullAddy.split(/, | - /);
        // $w('#shippingAddressInput').value = split[0];
        // $w("#shippingCityInput").value = split[1];
        // if (countriesWithStatesAndRegions.includes(shippingCountry[0])) {
        //     autocompleteStateDropdown(split[2])
        //     $w('#shippingPostalCodeInput').value = split[4]
        // } else {
        //     $w('#shippingPostalCodeInput').value = split[3]
        // }
        $w('#shippingAddressRepeater').collapse()
    });
}

function autocompleteStateDropdown(autoState) {
    let arr = $w('#shippingStateDropdown').options
    for (var key in arr) {
        if (arr[key].value === autoState || arr[key].label === autoState) {
            let sta = arr[key].label
            let index = parseInt(key)
            $w('#shippingStateDropdown').selectedIndex = index
        }
    }
}

function setStateDropdown() {
    if (shippingCountry[0] === "US") {
        const states = usStates.map((item, index) => {
            return {
                label: item.name,
                value: item.abbreviation
            }
        })
        $w('#shippingStateDropdown').options = states
    } else if (shippingCountry[0] === "BR") {
        const states = brazilStates.map((item, index) => {
            return {
                label: item.name,
                value: item.abbreviation
            }
        })
        $w('#shippingStateDropdown').options = states
    } else if (shippingCountry[0] === "CA") {
        const states = canadaStates.map((item, index) => {
            return {
                label: item.name,
                value: item.abbreviation
            }
        })
        $w('#shippingStateDropdown').options = states
    } else if (shippingCountry[0] === "IN") {
        const states = indiaStates.map((item, index) => {
            return {
                label: item.name,
                value: item.abbreviation
            }
        })
        $w('#shippingStateDropdown').options = states
    }

}

export function shipDifferntLocationButton_click(event) {
    wixWindow.openLightbox("Change Country LightBox")
}

export function shippingFirstNameInput_change(event) {
    $w('#shippingFirstNameErrorText').collapse()
}

export function shippingLastNameTextInput_change(event) {
    $w('#shippingLastNameErrorText').collapse()
}

export function shippingAddressInput_change(event) {
    $w('#shippingAddressErrorTextBox').collapse()
}

export function shippingCityInput_change(event) {
    $w('#shippingCityErrorText').collapse()
}

export function shippingPostalCodeInput_change(event) {
    $w('#shippingPostalCodeErrorText').collapse()
}

export function shippingStateDropdown_change(event) {
    $w('#shippingStateErrorText').collapse()
}

export function shippingPhoneNumberInput_change(event) {
    $w('#shippingPhoneNumberErrorTextInput').collapse()
}

function setUpDeliver(shipment) {
    $w('#shuppingEditButton').scrollTo()
    $w('#savedAddressDifferentAddressRadioGroup').disable()
    $w('#savedAddressDifferentAddressRadioGroup').style.borderColor = "rgba(151,151,151,1)"
    $w('#savedAddressDifferentAddressBox').style.borderColor = "rgba(151,151,151,1)"
    $w('#savedAddressRepeater').forEachItem(($item, itemData, index) => {
        $item('#savedAddressRadioGroup').disable()
        $item('#savedAddressRadioGroup').style.borderColor = "rgba(151,151,151,1)"
        $item('#savedAddressAddressBox').style.borderColor = "rgba(151,151,151,1)"
    })
    $w('#shippingPhoneAreaDropdown').disable()
    $w('#shippingPhoneNumberInput').disable()
    $w('#shippingCountryDropdown').disable()
    $w('#shippingPostalCodeInput').disable()
    $w('#shippingStateDropdown').disable()
    $w('#shippingCityInput').disable()
    $w('#shippingAddress2Input').disable()
    $w('#shippingAddressInput').disable()
    $w('#shippingFirstNameInput').disable()
    $w('#shippingLastNameTextInput').disable()
    $w('#deliveryBox').expand()
    $w('#deliveryStandardRadioGroup').selectedIndex = 0

    var rates = []
    rates = shipment.rates
    console.log("rates", rates)

    for (var option in rates) {
        var rate
        var standardRate, expressRate, nextDayRate
        var provider = rates[option].provider
        var pre = rates[option].amount_local
        var post = Math.ceil(pre)
        if (post % 10) {
            rate = post + (10 - post % 10);
        } else {
            rate = post
        }
        if (provider === "USPS") {
            let serviceName = rates[option].servicelevel.name
            if (serviceName === 'Parcel Select') {
                $w('#deliveryStandardPrice').text = currentCurrency.format(pre)
                standardRate = {
                    price: pre,
                    serviceLevelToken: rates[option].servicelevel.token,
                    carrierAccount: rates[option].carrier_account
                }
            }
            if (serviceName === 'Priority Mail') {
                $w('#box30').expand()
                $w('#deliveryExpressPrice').text = currentCurrency.format(pre)
                expressRate = {
                    price: pre,
                    serviceLevelToken: rates[option].servicelevel.token,
                    carrierAccount: rates[option].carrier_account
                }
            }
            if (serviceName === 'Priority Mail Express') {
                $w('#box71').expand()
                $w('#deliveryNextDayPrice').text = currentCurrency.format(pre)
                nextDayRate = {
                    price: pre,
                    serviceLevelToken: rates[option].servicelevel.token,
                    carrierAccount: rates[option].carrier_account
                }
            }
        }
        if (provider === "DHL Express") {
            let serviceName = rates[option].servicelevel.name
            if (serviceName === 'Worldwide') {
                $w('#deliveryStandardPrice').text = currentCurrency.format(pre)
                standardRate = {
                    price: pre,
                    serviceLevelToken: rates[option].servicelevel.token,
                    carrierAccount: rates[option].carrier_account
                }
            }
            $w('#box30').collapse()
            $w('#box71').collapse()
        }

    }

    selectedRate = standardRate

    wixPay.currencies.currencyConverter.convertAmounts({
            "amounts": [currentCart.totals.subtotal, currentCart.totals.discount, currentCart.totals.tax],
            "from": "USD",
            "to": currencyCode
        })
        .then((amounts) => {
            console.log(amounts.amounts[0], amounts.amounts[1], parseFloat(selectedRate.price), amounts.amounts[2])
            var newSubtotal = amounts.amounts[0] - amounts.amounts[1] + parseFloat(selectedRate.price) + amounts.amounts[2]
            $w('#orderSummaryTotal').text = currentCurrency.format(newSubtotal)
            $w('#deliveryPrice').text = currentCurrency.format(selectedRate.price)
        })

    $w('#orderSummaryDeliveryLabel').text = "DELIVERY: " + deliveryOption

    $w('#deliveryStandardRadioGroup').onClick(() => {
        $w('#deliveryExpressRadioGroup').selectedIndex = undefined
        $w('#deliveryNextDayRadioGroup').selectedIndex = undefined
        selectedRate = standardRate
        deliveryOption = standardDelivery
        wixPay.currencies.currencyConverter.convertAmounts({
                "amounts": [currentCart.totals.subtotal, currentCart.totals.discount, currentCart.totals.tax],
                "from": "USD",
                "to": currencyCode
            })
            .then((amounts) => {
                var newSubtotal = amounts.amounts[0] - amounts.amounts[1] + parseFloat(selectedRate.price) + amounts.amounts[2]
                $w('#orderSummaryTotal').text = currentCurrency.format(newSubtotal)
            })
        $w('#orderSummaryDeliveryLabel').text = "DELIVERY: " + deliveryOption
        $w('#deliveryPrice').text = currentCurrency.format(selectedRate.price)
    })
    $w('#deliveryExpressRadioGroup').onClick(() => {
        $w('#deliveryStandardRadioGroup').selectedIndex = undefined
        $w('#deliveryNextDayRadioGroup').selectedIndex = undefined
        selectedRate = expressRate
        deliveryOption = expressDelivery
        wixPay.currencies.currencyConverter.convertAmounts({
                "amounts": [currentCart.totals.subtotal, currentCart.totals.discount, currentCart.totals.tax],
                "from": "USD",
                "to": currencyCode
            })
            .then((amounts) => {
                var newSubtotal = amounts.amounts[0] - amounts.amounts[1] + parseFloat(selectedRate.price) + amounts.amounts[2]
                $w('#orderSummaryTotal').text = currentCurrency.format(newSubtotal)
            })
        $w('#orderSummaryDeliveryLabel').text = "DELIVERY: " + deliveryOption
        $w('#deliveryPrice').text = currentCurrency.format(selectedRate.price)
    })
    $w('#deliveryNextDayRadioGroup').onClick(() => {
        $w('#deliveryExpressRadioGroup').selectedIndex = undefined
        $w('#deliveryStandardRadioGroup').selectedIndex = undefined
        selectedRate = nextDayRate
        deliveryOption = nextDayDelivery
        wixPay.currencies.currencyConverter.convertAmounts({
                "amounts": [currentCart.totals.subtotal, currentCart.totals.discount, currentCart.totals.tax],
                "from": "USD",
                "to": currencyCode
            })
            .then((amounts) => {
                var newSubtotal = amounts.amounts[0] - amounts.amounts[1] + parseFloat(selectedRate.price) + amounts.amounts[2]
                $w('#orderSummaryTotal').text = currentCurrency.format(newSubtotal)
            })
        $w('#orderSummaryDeliveryLabel').text = "DELIVERY: " + deliveryOption
        $w('#deliveryPrice').text = currentCurrency.format(selectedRate.price)
    })

    shippingCarrier = provider

    $w('#editShippingAddressButton').onClick(() => {
        $w('#shippingPhoneAreaDropdown').enable()
        $w('#shippingPhoneNumberInput').enable()
        $w('#shippingCountryDropdown').enable()
        $w('#shippingPostalCodeInput').enable()
        $w('#shippingStateDropdown').enable()
        $w('#shippingCityInput').enable()
        $w('#shippingAddress2Input').enable()
        $w('#shippingAddressInput').enable()
        $w('#shippingFirstNameInput').enable()
        $w('#shippingLastNameTextInput').enable()
        $w('#savedAddressDifferentAddressRadioGroup').enable()
        $w('#savedAddressDifferentAddressRadioGroup').style.borderColor = "rgba(255,255,255,1)"
        $w('#savedAddressDifferentAddressBox').style.borderColor = "rgba(255,255,255,1)"
        $w('#savedAddressRepeater').forEachItem(($item, itemData, index) => {
            $item('#savedAddressRadioGroup').enable()
            $item('#savedAddressRadioGroup').style.borderColor = "rgba(255,255,255,1)"
            $item('#savedAddressAddressBox').style.borderColor = "rgba(255,255,255,1)"
        })
        $w('#deliveryBox').collapse()
        $w('#viewDeliveryOptionsButton').expand()
        $w('#editShippingAddressButton').collapse()
    })

    $w('#proceedToPaymentButton').onClick(() => {
        $w('#shippingAndDeliveryBox').scrollTo()
        setPayment()
    })
}

function setPayment() {
    billingFirstName = shippingFirstName
    $w('#billingFirstNameInput').value = billingFirstName
    billingLastName = shippingLastName
    $w('#billingLastNameInput').value = billingLastName
    billingStreet = shippingStreet
    $w('#billingAddressInput').value = billingStreet
    billingAddy2 = shippingAddy2
    $w('#billingAddress2Input').value = billingAddy2
    billingCity = shippingCity
    $w('#billingCityInput').value = billingCity
    billingPostalCode = shippingPostalCode
    $w('#billingPostalCodeInput').value = billingPostalCode
    billingCountry = shippingCountry
    billingState = shippingState
    $w('#billingStateDropdown').value = billingState
    billingPhoneNumber = shippingPhoneNumber
    billingPhoneNumberNoCode = shippingPhoneNumberNoCode
    $w('#billingPhoneNumberInput').value = billingPhoneNumberNoCode
    billingPhoneNumberCountryCode = shippingPhoneNumberCountryCode

    if (memberDetails.paymentMethods.length > 0) {
        $w('#savedPaymentMethodsBox').expand()
        setSavedPaymentsRepeater()
    }

    $w('#shippingBox').collapse()
    $w('#deliveryBox').collapse()
    $w('#savedAddressBox').collapse()
    $w('#paymentEditButton').collapse()
    $w('#paymentCardLabel').collapse()
    $w('#shippingDeliveryButtonBox').collapse()
    $w('#paymentMethodBox').expand()
    $w('#currentShippingLocationText').text = "Ship to " + shippingStreet + " " + shippingCity + ", " + shippingState + ", " + shippingCountry[1] + " " + shippingPostalCode
    $w('#shippingDeliveryAddress').expand()
    $w('#shippingDeliveryAddress').text = "DELIVERY: " + deliveryOption
    $w('#shuppingEditButton').expand()
    $w('#shipDifferntLocationButton').collapse()

    if ($w('#payWithGooglePayRadioButton').selectedIndex !== undefined ||
        $w('#payWithPayPalRadioButton').selectedIndex !== undefined ||
        $w('#payWithCardRadioButton').selectedIndex !== undefined) {
        $w('#paymentContinueBox').expand()
    }

    $w('#payWithGooglePayRadioButton').onClick(() => {
        $w('#payWithPayPalRadioButton').selectedIndex = undefined
        $w('#payWithCardRadioButton').selectedIndex = undefined
        payMethod = payWithGoogle
        $w('#paymentContinueBox').expand()

        $w('#cardNumberContainer').collapse()
        $w('#cardNameContainer').collapse()
        $w('#cardDateCVVContainer').collapse()
    })
    $w('#payWithPayPalRadioButton').onClick(() => {
        $w('#payWithGooglePayRadioButton').selectedIndex = undefined
        $w('#payWithCardRadioButton').selectedIndex = undefined
        payMethod = payWithPayPal
        $w('#paymentContinueBox').expand()

        $w('#cardNumberContainer').collapse()
        $w('#cardNameContainer').collapse()
        $w('#cardDateCVVContainer').collapse()
    })
    $w('#payWithCardRadioButton').onClick(() => {
        $w('#payWithPayPalRadioButton').selectedIndex = undefined
        $w('#payWithGooglePayRadioButton').selectedIndex = undefined
        payMethod = payWithCard
        $w('#paymentContinueBox').expand()

        $w('#cardNumberContainer').expand()
        $w('#cardNameContainer').expand()
        $w('#cardDateCVVContainer').expand()
    })

    $w('#billingSameAsShippingCheckBox').onClick(() => {
        if ($w('#billingSameAsShippingCheckBox').checked) {
            billingSameAsShipping = true
            $w('#billingBox').collapse()
            billingFirstName = shippingFirstName
            billingLastName = shippingLastName
            billingStreet = shippingStreet
            billingAddy2 = shippingAddy2
            billingCity = shippingCity
            billingPostalCode = shippingPostalCode
            billingCountry = shippingCountry
            billingState = shippingState
            billingPhoneNumber = shippingPhoneNumber
        } else {
            billingSameAsShipping = false
            $w('#billingBox').expand()
            billingFirstName = undefined
            billingLastName = undefined
            billingStreet = undefined
            billingAddy2 = undefined
            billingCity = undefined
            billingPostalCode = undefined
            billingCountry = undefined
            billingState = undefined
            billingPhoneNumber = undefined
        }
    })

    $w('#backToShippingButton').onClick(() => {
        $w('#reviewConfirmDetailBox').collapse()
        $w('#reviewConfirmOrderBox').collapse()
    })

    $w('#proceedToReviewAndConfirmButton').onClick(() => {
        $w('#billingFirstNameErrorText').collapse()
        $w('#billingLastNameErrorText').collapse()
        $w('#billingAddressErrorText').collapse()
        $w('#billingPostalCodeErrorText').collapse()
        $w('#billingStateErrorText').collapse()
        $w('#billingPhoneAreaErrorText').collapse()
        $w('#billingPhoneNumberErrorText').collapse()
        if ($w('#billingFirstNameInput').value === "") {
            $w('#billingFirstNameErrorText').expand()
            $w('#billingFirstNameErrorText').text = "FIRST NAME IS REQUIRED"
        }
        if ($w('#billingLastNameInput').value === "") {
            $w('#billingLastNameErrorText').expand()
            $w('#billingLastNameErrorText').text = "LAST NAME IS REQUIRED"
        }
        if ($w('#billingAddressInput').value === "") {
            $w('#billingAddressErrorText').expand()
            $w('#billingAddressErrorText').text = "ADDRESS IS REQUIRED"
        }
        if ($w('#billingCityInput').value === "") {
            $w('#billingCityErrorText').expand()
            $w('#billingCityErrorText').text = "CITY IS REQUIRED"
        }
        if ($w('#billingPostalCodeInput').value === "") {
            $w('#billingPostalCodeErrorText').expand()
            $w('#billingPostalCodeErrorText').text = "POSTAL CODE IS REQUIRED"
        }
        if ($w('#billingStateDropdown').selectedIndex === undefined) {
            $w('#billingStateErrorText').expand()
            $w('#billingStateErrorText').text = "STATE/REGION IS REQUIRED"
        }
        if ($w('#billingPhoneNumberInput').value === "") {
            $w('#billingPhoneNumberErrorText').expand()
            $w('#billingPhoneNumberErrorText').text = "STATE/REGION IS REQUIRED"
        }
        if (!$w('#billingStateErrorText').collapsed ||
            !$w('#billingPostalCodeErrorText').collapsed ||
            !$w('#billingCityErrorText').collapsed ||
            !$w('#billingAddressErrorText').collapsed ||
            !$w('#billingLastNameErrorText').collapsed ||
            !$w('#billingFirstNameErrorText').collapsed ||
            !$w('#billingPhoneNumberErrorText').collapsed) {
            return
        } else {
            billingFirstName = $w('#billingFirstNameInput').value
            billingLastName = $w('#billingLastNameInput').value
            billingStreet = $w('#billingAddressInput').value
            billingAddy2 = $w('#billingAddress2Input').value
            billingCity = $w('#billingCityInput').value
            billingState = $w('#billingStateDropdown').value
            billingPostalCode = $w('#billingPostalCodeInput').value
            billingPhoneNumber = $w('#billingPhoneCodeDropdown').value + $w('#billingPhoneNumberInput').value
            $w('#billingBox').collapse()
            $w('#paymentMethodBox').collapse()
            $w('#paymentCardLabel').expand()
            $w('#paymentEditButton').expand()
        }
    })

}

async function setSavedPaymentsRepeater() {
    var methods = []
    $w('#savedPaymentMethodsRepeater').data = []
    for (var index in memberDetails.paymentMethods) {
        await retrievePayMethod(memberDetails.paymentMethods[index], memberDetails.stripeId)
            .then((intent) => {
                console.log(intent)
                var methodType = intent.type
                var mySentence = intent.card.brand
                var type = mySentence.replace(/(^\w{1})|(\s+\w{1})/g, letter => letter.toUpperCase());
                var number = intent.card.last4
                var details = intent.card.exp_month + "/" + intent.card.exp_year + " ***"
                var item = {
                    _id: "method" + memberDetails.paymentMethods[index].substring(memberDetails.paymentMethods[index].length - 10),
                    method: intent.id,
                    setup: memberDetails.paymentMethods[index],
                    type: type,
                    number: number,
                    details: details,
                    methodType: methodType,
                    customer: intent.customer
                }
                methods.push(item)
            })
    }
    $w('#savedPaymentMethodsRepeater').data = []
    $w('#savedPaymentMethodsRepeater').data = methods
}

export function savedPayMethodRepeater_itemReady($item, $itemData) {
    $item('#savedPaymentTitle').text = $itemData.type
    if ($itemData.type === "Amex") {
        $item('#savedPaymentType').text = "**** ****** *" + $itemData.number + "    " + $itemData.details
    } else {
        $item('#savedPaymentType').text = "**** **** **** " + $itemData.number + "    " + $itemData.details
    }

    $item('#savedPaymentMethodRadioGroup').onChange(() => {
        if ($item('#savedPaymentMethodRadioGroup').selectedIndex === 0) {
            paymentItem = { id: $itemData.method, customer: $itemData.customer }
            if ($itemData.methodType === "card") {
                payMethod = payWithCard
                cType = $itemData.type
                if ($itemData.type === "Amex") {
                    $w('#paymentCardLabel').text = $itemData.type.toUpperCase() + " **** ****** *" + $itemData.number
                    $w('#reviewPaymentUsed').text = "**** ****** *" + $itemData.number
                } else {
                    $w('#paymentCardLabel').text = $itemData.type.toUpperCase() + " **** **** **** " + $itemData.number
                    $w('#reviewPaymentUsed').text = "**** **** **** " + $itemData.number
                }
            }
            $w('#paymentContinueBox').expand()
            $w('#savedPaymentMethodRadioGroup').selectedIndex = undefined
            $item('#savedPaymentMethodRadioGroup').selectedIndex = 0
            $w('#paymentMethodSelections').collapse()
            $w('#savedPaymentDifferentMethodRadioGroup').selectedIndex = undefined
            $w('#cardNumberContainer').collapse()
            $w('#cardNameContainer').collapse()
            $w('#cardDateCVVContainer').collapse()
        }
    })
}

export function savedPaymentDifferentMethodRadioGroup_change(event) {
    if ($w('#savedPaymentDifferentMethodRadioGroup').selectedIndex !== undefined) {
        $w('#paymentMethodSelections').expand()
        $w('#savedPaymentMethodsRepeater').forEachItem(($item, itemData, index) => {
            $item('#savedPaymentMethodRadioGroup').selectedIndex = undefined
        })
        if ($w('#payWithCardRadioButton').selectedIndex !== undefined) {
            payMethod = payWithCard
            $w('#paymentContinueBox').expand()

            $w('#cardNumberContainer').expand()
            $w('#cardNameContainer').expand()
            $w('#cardDateCVVContainer').expand()
        }
    }
}

var cardKeyPress = ""

export function cardNumberInput_keyPress(event) {
    $w('#cardNumberErrorText').collapse()
    //console.log(event.key)
    if (event.key === "Backspace") {
        cardKeyPress = "Backspace"
    } else {
        cardKeyPress = ""
    }

}
var cType = '';
var block1 = '';
var block2 = '';
var block3 = '';
var block4 = '';

export function cardNumberInput_change(event) {

    if (cType == 'Invalid') {
        // for Amex cards
        // block1 =  typeCheck;
        // block2='';
        // block3='';
        // block4='';
        $w('#cardNumberErrorText').text = "INVALID CARD NUMBER"
        $w('#cardNumberErrorText').expand()
    }
}

export function cardNumberInput_input(event) {

    cc_format(event.target.value)
}

function cc_format(ccid) {
    // supports Amex, Master Card, Visa, and Discover
    // parameter 1 ccid= id of credit card number field
    // parameter 2 ctid= id of credit card type field

    var ccNumString = ccid
    ccNumString = ccNumString.replace(/[^0-9]/g, '');
    //console.log(ccNumString)
    // mc, starts with - 51 to 55
    // v, starts with - 4
    // dsc, starts with 6011, 622126-622925, 644-649, 65
    // amex, starts with 34 or 37
    var typeCheck = ccNumString.substring(0, 2);
    cType = '';
    block1 = '';
    block2 = '';
    block3 = '';
    block4 = '';
    var formatted = '';

    if (typeCheck.length == 2) {
        typeCheck = parseInt(typeCheck);
        if (typeCheck >= 40 && typeCheck <= 49) {
            cType = 'Visa';
            $w('#cardTypeVector').src = 'wix:vector://v1/074041_6e473399471d45ffa112bf44cf37d180.svg/icons8-visa.svg'
        } else if (typeCheck >= 51 && typeCheck <= 55) {
            cType = 'Master Card';
            $w('#cardTypeVector').src = 'wix:vector://v1/074041_fa9e4cd02ed846f383bc1481ac88d520.svg/icons8-mastercard.svg'
        } else if ((typeCheck >= 60 && typeCheck <= 62) || (typeCheck == 64) || (typeCheck == 65)) {
            cType = 'Discover';
            $w('#cardTypeVector').src = 'wix:vector://v1/074041_8c6b49c4257d4c3e8be19af689f2a967.svg/icons8-discover.svg'
        } else if (typeCheck == 34 || typeCheck == 37) {
            cType = 'American Express';
            $w('#cardTypeVector').src = 'wix:vector://v1/074041_267c134751bf44c69f56d81265d48bef.svg/icons8-american-express.svg'
        } else {
            $w('#cardTypeVector').src = 'wix:vector://v1/074041_320ce19f5f5a48628654db20a227260e.svg/iconmonstr-minus-2.svg'
            cType = 'Invalid';
        }
    }
    if (typeCheck.length < 2) {
        $w('#cardTypeVector').src = 'wix:vector://v1/074041_320ce19f5f5a48628654db20a227260e.svg/iconmonstr-minus-2.svg'
        cType = 'Invalid';
    }

    // all support card types have a 4 digit firt block
    // if (cardKeyPress !== "Backspace") {
    block1 = ccNumString.substring(0, 4);
    if (block1.length == 4) {
        block1 = block1 + ' ';
    }

    if (cType == 'Visa' || cType == 'Master Card' || cType == 'Discover') {
        // for 4X4 cards
        block2 = ccNumString.substring(4, 8);
        if (block2.length == 4) {
            block2 = block2 + ' ';
        }
        block3 = ccNumString.substring(8, 12);
        if (block3.length == 4) {
            block3 = block3 + ' ';
        }
        block4 = ccNumString.substring(12, 16);
    } else if (cType == 'American Express') {
        // for Amex cards
        block2 = ccNumString.substring(4, 10);
        if (block2.length == 6) {
            block2 = block2 + ' ';
        }
        block3 = ccNumString.substring(10, 15);
        block4 = '';

    }
    // else if (cType == 'Invalid') {
    //     // for Amex cards
    //     block1 =  typeCheck;
    //     block2='';
    //     block3='';
    //     block4='';
    //     $w('#cardNumberErrorText').text = "INVALID CARD NUMBER"
    // }
    //console.log("NUmstri" + ccNumString)
    //console.log("blocks" + block1, block2, block3, block4)
    formatted = block1 + block2 + block3 + block4;
    $w('#cardNumberInput').value = formatted;
    // } else {
    //     // $w('#cardNumberInput').value = ccid;
    //     console.log("nums=tring: ," + ccid)
    //     console.log("last char: ," + ccid.charAt(ccid.length - 1))
    //     if (ccid.charAt(ccid.length-1) === " ") {
    //         var str = ccid.substring(0, ccid.length-1);
    //         console.log("new str: ," + str)
    //         $w('#cardNumberInput').value = str
    //     }
    // }
    //document.getElementById(ctid).value=cType;
}

export function shuppingEditButton_click(event) {
    let countryName = shippingCountry[1].toUpperCase()
    if (memberDetails.contactDetails.addresses.choices.length !== 0) {
        $w('#savedAddressBox').expand()
        if ($w('#savedAddressDifferentAddressRadioGroup').selectedIndex !== undefined) {
            $w('#shippingBox').expand()
            $w('#paymentMethodSelections').expand()
            $w('#savedAddressRepeater').forEachItem(($item, itemData, index) => {
                $item('#savedAddressRadioGroup').selectedIndex = undefined
            })
        }
    } else {
        $w('#shippingBox').expand()
    }
    $w('#savedPaymentMethodsBox').collapse()
    $w('#shippingDeliveryButtonBox').expand()
    $w('#paymentMethodSelections').collapse()
    $w('#deliveryBox').expand()
    $w('#paymentMethodBox').collapse()
    $w('#currentShippingLocationText').text = "​YOU ARE CURRENTLY SHIPPING TO " + (countryName)
    $w('#shippingDeliveryAddress').collapse()
    $w('#editShippingAddressButton').expand()
    $w('#shuppingEditButton').collapse()
    $w('#shipDifferntLocationButton').expand()
    $w('#paymentContinueBox').collapse()
    $w('#shippingAndDeliveryDetailBox').scrollTo()
    $w('#billingBox').collapse()
    $w('#reviewConfirmDetailBox').collapse()
    $w('#reviewConfirmOrderBox').collapse()
    $w('#paymentMethodBox').collapse()
    $w('#billingBox').collapse()
    $w('#paymentContinueBox').collapse()
    $w('#paymentCardLabel').expand()
    $w('#paymentEditButton').expand()
    if (payMethod === payWithCard && cType != "") {
        if ($w('#savedPaymentDifferentMethodRadioGroup').selectedIndex === 0) {
            var l4 = ($w('#cardNumberInput').value).substring(($w('#cardNumberInput').value).length - 4, ($w('#cardNumberInput').value).length);
            var convertC = $w('#cardNumberInput').value.replace(/[0-9]/g, "*")
            var ccc = convertC.substr(0, convertC.length - 4) + l4
            $w('#paymentCardLabel').text = cType.toUpperCase() + " " + ccc
        }
    }

}

export function backToShippingButton_click(event) {
    let countryName = shippingCountry[1].toUpperCase()
    if (memberDetails.contactDetails.addresses.choices.length !== 0) {
        $w('#savedAddressBox').expand()
        if ($w('#savedAddressDifferentAddressRadioGroup').selectedIndex !== undefined) {
            $w('#shippingBox').expand()
            $w('#paymentMethodSelections').expand()
            $w('#savedAddressRepeater').forEachItem(($item, itemData, index) => {
                $item('#savedAddressRadioGroup').selectedIndex = undefined
            })
        }
    } else {
        $w('#shippingBox').expand()
    }
    $w('#savedPaymentMethodsBox').collapse()
    $w('#shippingDeliveryButtonBox').expand()
    $w('#paymentMethodSelections').collapse()
    $w('#deliveryBox').expand()
    $w('#paymentMethodBox').collapse()
    $w('#currentShippingLocationText').text = "​YOU ARE CURRENTLY SHIPPING TO " + (countryName)
    $w('#shippingDeliveryAddress').collapse()
    $w('#editShippingAddressButton').expand()
    $w('#shuppingEditButton').collapse()
    $w('#shipDifferntLocationButton').expand()
    $w('#paymentContinueBox').collapse()
    $w('#shippingAndDeliveryDetailBox').scrollTo()
    $w('#billingBox').collapse()
    $w('#reviewConfirmDetailBox').collapse()
    $w('#reviewConfirmOrderBox').collapse()
    $w('#paymentMethodBox').collapse()
    $w('#billingBox').collapse()
    $w('#paymentContinueBox').collapse()
    $w('#paymentCardLabel').expand()
    $w('#paymentEditButton').expand()
    if (payMethod === payWithCard && cType != "") {
        if ($w('#savedPaymentDifferentMethodRadioGroup').selectedIndex === 0) {
            var l4 = ($w('#cardNumberInput').value).substring(($w('#cardNumberInput').value).length - 4, ($w('#cardNumberInput').value).length);
            var convertC = $w('#cardNumberInput').value.replace(/[0-9]/g, "*")
            var ccc = convertC.substr(0, convertC.length - 4) + l4
            $w('#paymentCardLabel').text = cType.toUpperCase() + " " + ccc
        }
    }
}

export function proceedToReviewAndConfirmButton_click(event) {
    $w('#paymentMethodBox').collapse()
    $w('#billingBox').collapse()
    $w('#savedPaymentMethodsBox').collapse()
    $w('#paymentContinueBox').collapse()
    $w('#reviewConfirmDetailBox').expand()
    $w('#reviewConfirmOrderBox').expand()
    $w('#paymentCardLabel').expand()
    $w('#paymentEditButton').expand()

    setReviewRepeater()
    $w('#proceedToReviewAndConfirmButton').scrollTo()
    // $w('#paymentCardLabel').text = payMethod
    $w('#reviewShippingNameText').text = shippingFirstName + " " + shippingLastName
    if (shippingAddy2) {
        $w('#reviewShippingStreetText').text = shippingStreet + " " + shippingAddy2
    } else {
        $w('#reviewShippingStreetText').text = shippingStreet
    }
    $w('#reviewShippingCityPostalText').text = shippingCity + " " + shippingState + ", " + shippingCountry[1] + " " + shippingPostalCode
    $w('#reviewShippingPhoneText').text = shippingPhoneNumber
    $w('#reviewPaymentMethod').text = cType.toUpperCase()

    if (payMethod === payWithCard && cType != "") {
        if ($w('#savedPaymentDifferentMethodRadioGroup').selectedIndex === 0) {
            var l4 = ($w('#cardNumberInput').value).substring(($w('#cardNumberInput').value).length - 4, ($w('#cardNumberInput').value).length);
            var convertC = $w('#cardNumberInput').value.replace(/[0-9]/g, "*")
            var ccc = convertC.substr(0, convertC.length - 4) + l4
            $w('#paymentCardLabel').text = cType.toUpperCase() + " " + ccc
            $w('#reviewPaymentUsed').text = ccc
        }
    }
}

export function paymentEditButton_click(event) {
    if (memberDetails.paymentMethods.length !== 0) {
        $w('#savedPaymentMethodsBox').expand()
        if ($w('#savedPaymentDifferentMethodRadioGroup').selectedIndex !== undefined) {
            $w('#savedPaymentMethodsBox').expand()
            $w('#paymentMethodSelections').expand()
            $w('#savedPaymentMethodsRepeater').forEachItem(($item, itemData, index) => {
                $item('#savedPaymentMethodRadioGroup').selectedIndex = undefined
            })
        }
    } else {
        $w('#paymentMethodSelections').expand()
    }
    $w('#savedPaymentMethodsBox').expand()
    $w('#paymentMethodBox').expand()
    if (!billingSameAsShipping) {
        $w('#billingBox').expand()
    }
    $w('#paymentContinueBox').expand()
    $w('#reviewConfirmDetailBox').collapse()
    $w('#reviewConfirmOrderBox').collapse()
    $w('#paymentCardLabel').collapse()
    $w('#paymentEditButton').collapse()
    $w('#shippingBox').collapse()
    $w('#deliveryBox').collapse()
    $w('#currentShippingLocationText').text = "Ship to " + shippingStreet + " " + shippingCity + ", " + shippingState + ", " + shippingCountry[1] + " " + shippingPostalCode
    $w('#shippingDeliveryAddress').expand()
    $w('#shippingDeliveryAddress').text = "DELIVERY: " + deliveryOption
    $w('#shuppingEditButton').expand()
    $w('#shipDifferntLocationButton').collapse()

}

function setReviewRepeater() {
    const cartItems = currentCart.lineItems.map((item, index) => {
        return {
            _id: item.id.toString(),
            price: item.price,
            name: item.name,
            sku: item.sku,
            image: item.mediaItem.src,
            size: item.options[0].selection
        }
    })
    $w('#reviewRepeater').data = cartItems
}

export function reviewRepeater_itemReady($item, $itemData, index) {
    $item('#productImage').src = $itemData.image
    $item('#productName').text = $itemData.name.toUpperCase()
    $item('#productSize').text = "SIZE: " + $itemData.size
    setItemColor($itemData.sku)
        .then((color) => {
            $item('#productColor').text = "COLOR: " + color.toUpperCase()
        })
    let price = $itemData.price
    wixPay.currencies.currencyConverter.convertAmounts({
            "amounts": [price],
            "from": "USD",
            "to": currencyCode
        })
        .then((amounts) => {
            $item('#productPrice').text = currentCurrency.format(amounts.amounts[0])
        })
}

export async function placeOrderButton_click(event) {
    if (!$w('#privacyPolicyCheckbox').checked || !$w('#termsAndConditionsCheckBox').checked) {
        $w('#reviewErrorMessege').expand()
        $w('#reviewErrorMessege').text = "Please read and agree to both privacy policy and terms and conditions.".toUpperCase()
    } else {
        $w('#reviewErrorMessege').collapse()
        let itemNames = []
        for (var item in currentCart.lineItems) {
            var name = currentCart.lineItems[item].name
            itemNames.push(name)
        }

        let products = currentCart.lineItems.map((item, index) => {
            return {
                quantity: 1,
                price: item.price,
                name: item.name,
                //size: item.options.children[0].selection
            }
        })
        //console.log(currentCart.totals.tax)

        let amount = 0

        var shippingPriceFinalUS = 0
        await wixPay.currencies.currencyConverter.convertAmounts({
                "amounts": [currentCart.totals.subtotal, currentCart.totals.discount, currentCart.totals.tax],
                "from": "USD",
                "to": currencyCode
            })
            .then((amounts) => {
                amount = amounts.amounts[0] - amounts.amounts[1] + parseFloat(selectedRate.price) + amounts.amounts[2]
            })
        await wixPay.currencies.currencyConverter.convertAmounts({
                "amounts": [amount, selectedRate.price],
                "from": currencyCode,
                "to": "USD"
            })
            .then((amounts) => {
                amount = amounts.amounts[0]
                shippingPriceFinalUS = amounts.amounts[1]
            })
        var price
        if (Number.isInteger(amount)) {
            price = amount * 100
        } else {
            price = parseInt(amount.toFixed(2).replace(".", ""))
        }

        //console.log(price)

        let co = {
            amount: price /*parseFloat(currentCurrency.format(currentCart.totals.subtotal - currentCart.totals.discount + selectedRate + currentCart.totals.tax).replace("$", ""))*/ ,
            currency: "USD",
            ip: "192.168.0.1",
            description: 'Payment for the purchase of ' + itemNames.toString(),
            receipt_email: "sales@relentlessbtl.com",
            // shipping: {
            //     address: {
            //         line1: shippingStreet,
            //         line2: shippingAddy2,
            //         city: shippingCity,
            //         country: shippingCountry[0],
            //         state: shippingState,
            //         postal_code: shippingPostalCode
            //     },
            //     name: shippingFirstName + " " + shippingLastName,
            //     carrier: shippingCarrier,
            //     phone: shippingPhoneNumber
            // },
            statement_descriptor_suffix: "Relentless Official"

            // customerEmail: accountEmail,
            // customerName: accountFirstName + " " + accountLastName,
            // billingAddress1: billingStreet,
            // billingAddress2: billingAddy2,
            // billingCity: billingCity,
            // billingState: billingState,
            // billingPostalCode: billingPostalCode,
            // billingCountry: billingCountry[0],
            // billingPhone: billingPhoneNumberNoCode,
            // billingPhoneCountryCode: billingPhoneNumberCountryCode,
            // products: products,
            // language: wixWindow.multilingual.currentLanguage
        }

        if ($w('#savedPaymentDifferentMethodRadioGroup').selectedIndex === 0 && $w('#payWithCardRadioButton').selectedIndex === 0) {
            paymentItem = await encodeCard(createCard())
            createToken(paymentItem)
                .then((token) => {
                    charge(token, co)
                        .then((response) => {
                            console.log(response)
                            continueCheckout(response.chargeId, amount, shippingPriceFinalUS)
                        })
                        .catch(error => {
                            // Inventory decrement failed
                            console.error(error);
                        })
                });
        }
        if ($w('#savedPaymentDifferentMethodRadioGroup').selectedIndex !== 0) {
            chargePI(paymentItem, co)
                .then((response) => {
                    console.log(response)
                    continueCheckout(response.charges.data[0], amount, shippingPriceFinalUS)
                })
                .catch(error => {
                    // Inventory decrement failed
                    console.error(error);
                })
        }
    }
}

function continueCheckout(response, amount, shippingPriceFinalUS) {
    var oo;
    var memId = "e81e9c48-f954-4044-ba64-ccfe5c103c8f"
    var member = "VISITOR"

    if (loggedIn === true) {
        memId = curMember._id
        member = "MEMBER"
    }

    var orderLineItems = currentCart.lineItems.map((item, index) => {
        return {
            name: item.name,
            productId: item.productId,
            lineItemType: "PHYSICAL",
            sku: item.sku,
            weight: item.weight,
            quantity: item.quantity,
            priceData: {
                price: item.totalPrice,
                taxIncludedInPrice: false
            },
            options: [{
                option: "Size",
                selection: item.options[0].selection
            }],
            mediaItem: item.mediaItem

        }
    })

    var fufullItem = currentCart.lineItems.map((item, index) => {
        return {
            index: index,
            quantity: 1
        }
    })

    transactionCreation(shipment, selectedRate.serviceLevelToken, selectedRate.carrierAccount)
        .then((label) => {
            var shippingLabel = label.label_url
            console.log(label)
            oo = {
                orderNumber: undefined,
                status: "Proccessing",
                language: wixWindow.multilingual.currentLanguage,
                cartId: currentCart._id,
                currency: "USD",
                billingAddress1: billingStreet,
                billingAddress2: billingAddy2,
                billingCity: billingCity,
                billingState: billingState,
                billingPostalCode: billingPostalCode,
                billingCountry: billingCountry[1],
                billingPhone: billingPhoneNumberCountryCode + billingPhoneNumberNoCode,
                billingFirstName: billingFirstName,
                billingLastName: billingLastName,
                billingEmail: billingLoginEmail,
                paymentMethod: cType.toUpperCase(),
                chargeId: response.id,
                stripeCustomerId: response.customer,
                buyerId: memId,
                buyerIT: member,
                buyerEmail: accountEmail,
                total: parseFloat(amount.toFixed(2)),
                tax: parseFloat(currentCart.totals.tax),
                shipping: parseFloat(shippingPriceFinalUS.toFixed(2)),
                discount: parseFloat(currentCart.totals.discount),
                subtotal: parseFloat(currentCart.totals.subtotal),
                shippingAddress1: shippingStreet,
                shippingAddress2: shippingAddy2,
                shippingCity: shippingCity,
                shippingState: shippingState,
                shippingPostalCode: shippingPostalCode,
                shippingCountry: shippingCountry[1],
                shippingPhone: shippingPhoneNumberCountryCode + shippingPhoneNumberNoCode,
                shippingFirstName: shippingFirstName,
                shippingLastName: shippingLastName,
                shippingEmail: shippingLoginEmail,
                lineItems: orderLineItems,
                deliveryOption: label.rate.provider + " " + label.rate.servicelevel_name,
                deliveryMethod: deliveryOption,
                fufillments: {
                    id: label.object_id,
                    dateCreated: label.object_created,
                    dateShipped: undefined,
                    dateDelivered: undefined,
                    trackingInfo: {
                        trackingNumber: label.tracking_number,
                        shippingProvider: label.rate.provider,
                        trackingLink: label.tracking_url_provider,
                    },
                    lineItems: fufullItem
                }

            }

            if (currentCart.appliedCoupon) {
                oo = {
                    orderNumber: undefined,
                    status: "Proccessing",
                    language: wixWindow.multilingual.currentLanguage,
                    cartId: currentCart._id,
                    currency: "USD",
                    billingAddress1: billingStreet,
                    billingAddress2: billingAddy2,
                    billingCity: billingCity,
                    billingState: billingState,
                    billingPostalCode: billingPostalCode,
                    billingCountry: billingCountry[1],
                    billingPhone: billingPhoneNumberCountryCode + billingPhoneNumberNoCode,
                    billingFirstName: billingFirstName,
                    billingLastName: billingLastName,
                    billingEmail: billingLoginEmail,
                    paymentMethod: cType.toUpperCase(),
                    chargeId: response.id,
                    stripeCustomerId: response.customer,
                    buyerId: memId,
                    buyerIT: member,
                    buyerEmail: accountEmail,
                    total: parseFloat(amount.toFixed(2)),
                    tax: parseFloat(currentCart.totals.tax),
                    shipping: parseFloat(shippingPriceFinalUS),
                    discount: parseFloat(currentCart.totals.discount),
                    subtotal: parseFloat(currentCart.totals.subtotal),
                    shippingAddress1: shippingStreet,
                    shippingAddress2: shippingAddy2,
                    shippingCity: shippingCity,
                    shippingState: shippingState,
                    shippingPostalCode: shippingPostalCode,
                    shippingCountry: shippingCountry[1],
                    shippingPhone: shippingPhoneNumberCountryCode + shippingPhoneNumberNoCode,
                    shippingFirstName: shippingFirstName,
                    shippingLastName: shippingLastName,
                    shippingEmail: shippingLoginEmail,
                    lineItems: orderLineItems,
                    deliveryOption: label.rate.provider + " " + label.rate.servicelevel_name,
                    noc: $w("#cardNameInput").value,
                    fufillments: {
                        id: label.object_id,
                        dateCreated: label.object_created,
                        dateShipped: undefined,
                        dateDelivered: undefined,
                        trackingInfo: {
                            trackingNumber: label.tracking_number,
                            shippingProvider: label.rate.provider,
                            trackingLink: label.tracking_url_provider
                        },
                        lineItems: fufullItem
                    },
                    coupon: currentCart.appliedCoupon
                }
            }
            console.log(shippingCountry[0], oo)
            var source
            if (response.source) {
                source = response.source.id
            } else {
                source = response.payment_method
            }
            console.log("jftytyk",oo, response.id, source, shippingCountry[0], billingCountry[0])
            createOrder(oo, response.id, source, shippingCountry[0], billingCountry[0])
                .then(async (order) => {
                    console.log(order)
                    var date = getFormattedDate(order._updatedDate)
                    var decArray = []
                    const newOrderId = order.number;
                    oo.orderNumber = newOrderId
                    for (var i in order.lineItems) {
                        var size = order.lineItems[i].options[0].selection
                        //console.log("ID:" + order.lineItems[i].productId)
                        await getProductVariants(order.lineItems[i].productId)
                            .then((varients) => {
                                //console.log(varients)
                                for (var j in varients) {
                                    //console.log(size, varients[i].choices.Size)
                                    if (varients[j].choices.Size === size) {
                                        var dec = {
                                            variantId: varients[j]._id,
                                            productId: order.lineItems[i].productId,
                                            decrementBy: 1
                                        }
                                        decArray.push(dec)
                                    }
                                }
                            })

                    }
                    decrementInventory(decArray).then(async () => {
                            console.log("Inventory decremented successfully")
                            await formReturn(oo,
                                    newOrderId,
                                    cType, date,
                                    deliveryOption
                                )
                                .then(async (invoiceURL) => {

                                    const emailResult = await sendEmail(
                                        "junkmailshawty@gmail.com",
                                        'ORDER #' + newOrderId,
                                        "LABEL : " + shippingLabel,
                                        invoiceURL
                                    );
                                    if (emailResult[0].statusCode === 202) {
                                        console.log('Email was sent');
                                        const ocResult = await sendOrderConfirmationToCustomer(
                                            oo,
                                            newOrderId,
                                            label.tracking_number,
                                            accountFirstName + " " + accountLastName,
                                            invoiceURL,
                                            cType,
                                            locale,
                                            currencyCode
                                        )
                                        if (ocResult[0].statusCode === 202) {
                                            console.log('Order Confirmation was sent');
                                        } else {
                                            console.log(ocResult[0].statusCode, 'Error sending order Confirmation, please verify your SendGrid account details.');
                                        }
                                    } else {
                                        console.log(emailResult[0].statusCode, 'Error sending email, please verify your SendGrid account details.');
                                    }
                                    const buyerEmail = order.buyerInfo.email;
                                    session.setItem("hotOrder", newOrderId + "~" + (accountFirstName + " " + accountLastName))
                                    wixLocation.to("/thank-you-page")
                                })
                        })
                        .catch(error => {
                            // Inventory decrement failed
                            console.error(error);
                        })
                })
                .catch((error) => {
                    console.error(error);
                });
        });

}

function createCard() {
    return {
        "name": $w("#cardNameInput").value,
        "number": $w("#cardNumberInput").value.replace(" ", ""),
        "cvc": $w("#cardCVCInput").value,
        "exp_year": $w('#cardExpirationYearInput').value,
        "exp_month": $w('#cardExpirationMonthInput').value
    };
}

function getFormattedDate(string) {
    var date = new Date(string)
    var year = date.getFullYear();

    var month = (1 + date.getMonth()).toString();
    month = month.length > 1 ? month : '0' + month;

    var day = date.getDate().toString();
    day = day.length > 1 ? day : '0' + day;

    return month + '/' + day + '/' + year;
}
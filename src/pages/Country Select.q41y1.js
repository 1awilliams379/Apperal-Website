import { northAmericanCountries, africaCountries, southAmericanCountries, asiaCountries, europeCountries, middleEastCountries, oceaniaCountries } from "public/shippingBack"
import { local } from 'wix-storage';
import wixLocation from 'wix-location';
import wixWindow from 'wix-window';

import {setCurrency} from 'backend/products'

var memberIsLoggedIn

$w.onReady(function () {

    setNorthAmericas()
    setSouthAmericas()
    setAfrica()
    setEurope()
    setAsia()
    setmiddleEast()
    setOceania()

    let currentRegion = local.getItem("userCountry")
    if (currentRegion) {
        let regionName = currentRegion.split("~")
        let countryName = regionName[1]
        $w('#currentRegionText').text = "CURRENT COUNTRY/REGION: " + (countryName.toUpperCase())
        $w('#currentRegionText').expand()
    } else {
        $w('#currentRegionText').collapse()
    }

});

function setNorthAmericas() {

    const list = northAmericanCountries.map((item, index) => {
        return {
            _id: item.countryCode,
            key: item.countryName,
            language: item.language,
            currency: item.currency,
            locale: item.locale
        }
    })
    $w('#americasRepeater').data = list;
}

function setSouthAmericas() {

    const list = southAmericanCountries.map((item, index) => {
        return {
            _id: item.countryCode,
            key: item.countryName,
            language: item.language,
            currency: item.currency,
            locale: item.locale
        }
    })
    $w('#southAmericaRepeater').data = list;
}

function setAfrica() {

    const list = africaCountries.map((item, index) => {
        return {
            _id: item.countryCode,
            key: item.countryName,
            language: item.language,
            currency: item.currency,
            locale: item.locale
        }
    })
    $w('#africaRepeater').data = list;
}

function setEurope() {

    const list = europeCountries.map((item, index) => {
        return {
            _id: item.countryCode,
            key: item.countryName,
            language: item.language,
            currency: item.currency,
            locale: item.locale
        }
    })
    $w('#europeRepeater').data = list;
}

function setAsia() {

    const list = asiaCountries.map((item, index) => {
        return {
            _id: item.countryCode,
            key: item.countryName,
            language: item.language,
            currency: item.currency,
            locale: item.locale
        }
    })
    $w('#asiaRepeater').data = list;
}

function setmiddleEast() {

    const list = middleEastCountries.map((item, index) => {
        return {
            _id: item.countryCode,
            key: item.countryName,
            language: item.language,
            currency: item.currency,
            locale: item.locale
        }
    })
    //console.log(list)
    $w('#middleEastRepeater').data = list;
}

function setOceania() {

    const list = oceaniaCountries.map((item, index) => {
        return {
            _id: item.countryCode,
            key: item.countryName,
            language: item.language,
            currency: item.currency,
            locale: item.locale
        }
    })
    $w('#oceaniaRepeater').data = list;
}

export function americasRepeater_itemReady($item, itemData, index) {
    $item('#countryButton').label = itemData.key
    $item('#countryButton').onClick(() => {
        buttonClicked(itemData)
    })
}

export function southAmericaRepeater_itemReady($item, itemData, index) {
    $item('#sACountryButton').label = itemData.key
    $item('#sACountryButton').onClick(() => {
        buttonClicked(itemData)
    })
}

export function oceaniaRepeater_itemReady($item, itemData, index) {
    $item('#oceaniaCountryButton').label = itemData.key
    $item('#oceaniaCountryButton').onClick(() => {
        buttonClicked(itemData)
    })
}

export function middleEastRepeater_itemReady($item, itemData, index) {
    console.log(itemData.key)
    $item('#middleEastCountryButton').label = itemData.key
    $item('#middleEastCountryButton').onClick(() => {
        buttonClicked(itemData)
    })
}

export function asiaRepeater_itemReady($item, itemData, index) {
    $item('#asiaCountryButton').label = itemData.key
    $item('#asiaCountryButton').onClick(() => {
        buttonClicked(itemData)
    })
}

export function europeRepeater_itemReady($item, itemData, index) {
    $item('#europeCountryButton').label = itemData.key
    $item('#europeCountryButton').onClick(() => {
        buttonClicked(itemData)
    })
}

export function africaRepeater_itemReady($item, itemData, index) {
    $item('#africaCountryButton').label = itemData.key
    $item('#africaCountryButton').onClick(() => {
        buttonClicked(itemData)
    })
}

function buttonClicked(itemData) {
    setCurrency(itemData.currency)
    .then((res) => {
        console.log(res)
    })
    if (itemData.language.length > 1) {
        //Prompt for language selection
        wixWindow.openLightbox("SELECT LANGUAGE LIGHTBOX", {
                "s1": itemData.language
            })
            .then((data) => {
                if (data !== null) {
                    local.setItem("userCountry", (itemData._id + "~" + itemData.key + "~" + itemData.language + "~" + itemData.currency + "~" + itemData.locale));
                    local.setItem("userLanguage", itemData.language[data.s1] + "~" + itemData.locale[data.s1])
                    wixLocation.to("https://ruccioculli.editorx.io/my-site/" + itemData.language[data.s1])
                }
            })
    } else {
        local.setItem("userCountry", (itemData._id + "~" + itemData.key + "~" + itemData.language + "~" + itemData.currency + "~" + itemData.locale));
        local.setItem("userLanguage", itemData.language[0] + "~" + itemData.locale[0])
        wixLocation.to("https://ruccioculli.editorx.io/my-site/" + itemData.language[0])
    }
}
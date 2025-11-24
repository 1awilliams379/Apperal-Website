import wixLocation from 'wix-location';
import wixWindow from 'wix-window';
import wixMembers from 'wix-members';
import wixData from 'wix-data';
import { session, local } from 'wix-storage';
import { getAuthUrl } from 'backend/oAuth.jsw';
import { phoneCountryCodes } from "public/shippingBack"
import { daysInMonthArr, yearsArr, monthsArr } from 'public/sitewide'
import { encryptPass, firebaseRegistration, getWixCreds, checkIfUserExists } from 'backend/account'

import { app } from "public/firebaseConfig";
import { getAuth, signInWithCustomToken } from 'firebase/auth'

var passwordRegex = /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$ %^&*-]).{8,}$/
var phoneRegex = /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/
var emailRegex = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
var ddmmyyyyRegex = /(?:(?:31(\/|-|\.)(?:0?[13578]|1[02]))\1|(?:(?:29|30)(\/|-|\.)(?:0?[13-9]|1[0-2])\2))(?:(?:1[6-9]|[2-9]\d)?\d{2})$|^(?:29(\/|-|\.)0?2\3(?:(?:(?:1[6-9]|[2-9]\d)?(?:0[48]|[2468][048]|[13579][26])|(?:(?:16|[2468][048]|[3579][26])00))))$|^(?:0?[1-9]|1\d|2[0-8])(\/|-|\.)(?:(?:0?[1-9])|(?:1[0-2]))\4(?:(?:1[6-9]|[2-9]\d)?\d{2})/

var userCountry

var firstName, lastName, birthday, gender, phoneNumber, email, title, phoneCountryCode
var marketingConsent = false
var updatedTermsConsent = false
var updatedPrivacy = false
var newsletterConsent = false
var smsConsent = false
var mailConsent = false
var profilingConsent = false

$w.onReady(function () {
    //thirdPartyRegistration()
    setData()
});

function setData() {
    let startcountry = local.getItem("userCountry");
    userCountry = startcountry.split('~')
    setPassword()
    setPhoneDropdown()
    setBirthdayDropdowns()
    $w('#createAccountButton').onClick(() => {
        if (!$w('#firstNameInput').value) {
            $w('#firstNameErrorText').expand()
            $w('#firstNameErrorText').text = "PLEASE ENTER A VALID FIRST NAME"
        }
        if (!$w('#lasNameInput').value) {
            $w('#lastNameErrorText').expand()
            $w('#lastNameErrorText').text = "PLEASE ENTER A VALID LAST NAME"
        }
        if (!$w('#dOBYearDropdown').value) {
            $w('#birthdayYearErrorText').expand()
            $w('#birthdayYearErrorText').text = "PLEASE SELECT A VALUE FROM THE LIST"
        }
        if (!$w('#dOBMonthDropdown').value) {
            $w('#birthdayMonthErrorText').expand()
            $w('#birthdayMonthErrorText').text = "PLEASE SELECT A VALUE FROM THE LIST"
        }
        if (!$w('#dobDayDropdown').value) {
            $w('#birthdayDayErrorText').expand()
            $w('#birthdayDayErrorText').text = "PLEASE SELECT A VALUE FROM THE LIST"
        }
        if (!$w('#genderRadioGroup1').value && !$w('#genderRadioGroup2').value) {
            $w('#genderErrorText').expand()
            $w('#genderErrorText').text = "PLEASE SELECT A VALUE"
        }
        if (!$w('#phoneAreaDropdown').value) {
            $w('#phoneAreaErrorText').expand()
            $w('#phoneAreaErrorText').text = "PLEASE SELECT A VALUE FROM THE LIST"
        }
        if (!$w('#phoneInput').value) {
            $w('#PhoneNumberErrorText').expand()
            $w('#PhoneNumberErrorText').text = "PHONE NUMBER REQUIRED"
        }
        if (!$w('#phoneInput').value.match(phoneRegex)) {
            $w('#PhoneNumberErrorText').expand()
            $w('#PhoneNumberErrorText').text = "PLEASE ENTER A VALID PHONE NUMBER"
        }
        if (!$w('#emailInput').value.match(emailRegex)) {
            validateEmailInput($w('#emailInput').value, $w('#emailErrorText'), $w('#memberEmailCheck'))
        }
        if (!$w('#passwordInput').value) {
            $w('#passwordErrorText').expand()
            $w('#passwordErrorText').text = "PASSWORD REQUIRED"
        }
        if (!$w('#passwordInput').value.match(passwordRegex)) {
            $w('#passwordErrorText').expand()
            $w('#passwordErrorText').text = "PASSWORD MUST BE A MINIMUM OF EIGHT CHARACTERS, AT LEAST ONE UPPER CASE ENGLISH LETTER, ONE LOWER CASE ENGLISH LETTER, ONE NUMBER AND ONE SPECIAL CHARACTER"
        }
        if (!$w('#emailInput').value.match(emailRegex)) {
            $w('#emailErrorText').expand()
            validateEmailInput($w('#emailInput').value, $w('#emailErrorText'), $w('#memberEmailCheck'))
        }
        birthday = $w('#dobDayDropdown').value + "-" + $w('#dOBMonthDropdown').value + "-" + $w('#dOBYearDropdown').value
        if (!birthday.match(ddmmyyyyRegex)) {
            $w('#birthdayMonthErrorText').text = "PLEASE ENTER A VALID DATE"
        }
        if ($w('#firstNameErrorText').collapsed &&
            $w('#lastNameErrorText').collapsed &&
            $w('#birthdayDayErrorText').collapsed &&
            $w('#birthdayMonthErrorText').collapsed &&
            $w('#birthdayYearErrorText').collapsed &&
            $w('#genderErrorText').collapsed &&
            $w('#phoneAreaErrorText').collapsed &&
            $w('#PhoneNumberErrorText').collapsed &&
            $w('#emailErrorText').collapsed &&
            $w('#passwordErrorText').collapsed &&
            $w('#privacyPolicyCheckbox').valid) {
            checkIfUserExists($w('#emailInput').value)
                .then((result) => {
                    if (result) {
                        console.log("USER EXISTS ALREADY")
                        return
                    } else {
                        registerUser()
                    }
                })
        } else {
            if (!$w('#privacyPolicyCheckbox').valid) {
                $w('#privacyPolicyCheckbox').updateValidityIndication()
            }
            $w('#registerBox').scrollTo()
        }
    })
}

function setPhoneDropdown() {
    let arr = phoneCountryCodes.map((item, index) => {
        return {
            label: "+" + item.code,
            value: item.name
        }
    })
    $w('#phoneAreaDropdown').options = arr

    for (var country in arr) {
        if (userCountry[1] === arr[country].value) {
            let index = parseInt(country)
            $w('#phoneAreaDropdown').selectedIndex = index
            break
        }
    }

}

function setBirthdayDropdowns() {
    let yarr = yearsArr.map((item, index) => {
        return {
            label: item,
            value: item
        }
    })
    $w('#dOBYearDropdown').options = yarr

    let marr = monthsArr.map((item, index) => {
        return {
            label: item,
            value: item
        }
    })
    $w('#dOBMonthDropdown').options = marr

    let darr = daysInMonthArr.map((item, index) => {
        return {
            label: item,
            value: item
        }
    })
    $w('#dobDayDropdown').options = darr
}

function setPassword() {
    $w('#passwordShow').onClick(() => {
        $w('#passwordInput').focus()
        if ($w('#passwordShow').label === "SHOW") {
            $w('#passwordShow').label = "HIDE"
            $w('#passwordInput').inputType = "text";
        } else {
            $w('#passwordShow').label = "SHOW"
            $w('#passwordInput').inputType = "password";
        }
    })
}

function validateEmailInput(input, error, check, button) {

    if (!input.match(emailRegex)) {
        error.expand()
        check.collapse()
        error.text = "PLEASE ENTER A VALID EMAIL"

    } else {
        check.expand()
        error.collapse()
    }
}

function registerUser() {

    let perferedCountry = local.getItem("userCountry");
    let perferedLanguage = local.getItem("userLanguage");
    updatedPrivacy = true
    updatedTermsConsent = true
    firstName = $w('#firstNameInput').value
    lastName = $w('#lasNameInput').value
    if ($w('#genderRadioGroup1').value) {
        gender = $w('#genderRadioGroup1').value
    } else if ($w('#genderRadioGroup2').value) {
        gender = $w('#genderRadioGroup2').value
    }
    if ($w('#titleDropdown').value) {
        title = $w('#titleDropdown').value
    }
    phoneCountryCode = $w('#phoneAreaDropdown').options[$w('#phoneAreaDropdown').selectedIndex].label.replace("+", "")
    phoneNumber = $w('#phoneInput').value
    email = $w('#emailInput').value
    if ($w('#marketingConsentCheckbox').value) {
        marketingConsent = true
    }
    if ($w('#dataMArketingCheckbox').value) {
        profilingConsent = true
    }
    if ($w('#newsletterBox').value) {
        newsletterConsent = true
    }
    if ($w('#smsCheckbox').value) {
        smsConsent = true
    }
    if ($w('#mailCheckbox').value) {
        mailConsent = true
    }

    const wixoptions = {
        "contactInfo": {
            firstName: firstName,
            lastName: lastName,
            emails: [
                email
            ],
            phones: [
                phoneNumber
            ],
        }
    }

    getWixCreds($w('#passwordInput').value, wixoptions)
        .then(async (creds) => {
            //console.log("creds ", creds)
            let res = creds.wix
            if (creds.login.approved) {
                wixMembers.authentication.applySessionToken(creds.login.sessionToken);
                let stripeId = creds.stripeId
                var newMem = {
                    "_id": undefined,
                    "stripeId": undefined,
                    "email": undefined,
                    "auth": undefined,
                    "wixEmail": undefined,
                    "wixAuth": undefined,
                    "registrationDate": undefined,
                    "lastLoginDate": undefined,
                    "lastUpdate": undefined,
                    "updatedTerms": false,
                    "updatedPrivacy": false,
                    "contactDetails": {
                        "title": undefined,
                        "firstName": undefined,
                        "lastName": undefined,
                        "birthday": undefined,
                        "gender": undefined,
                        "phoneNumber": undefined,
                        "phoneCountryCode": undefined,
                        "addresses": {
                            "favorite": undefined,
                            "choices": [],
                        },

                    },
                    "orders": undefined,
                    "savedForLater": [],
                    "paymentMethods": [],
                    "preferences": {
                        "marketingConsent": false,
                        "dataProfiling": false,
                        "marketing": {
                            "newsletterEmail": false,
                            "smsMms": false,
                            "mail": false
                        },
                        "countryPreference": undefined,
                        "languagePreference": undefined,
                        "interest": {
                            "menswear": false,
                            "womenswear": false
                        },
                    }

                }
                newMem._id = res.member._id
                newMem.registrationDate = res.member._createdDate
                newMem.lastLoginDate = res.member._createdDate
                newMem.lastUpdate = res.member._createdDate
                newMem.contactDetails.title = title
                newMem.contactDetails.firstName = firstName
                newMem.contactDetails.lastName = lastName
                newMem.contactDetails.birthday = birthday
                newMem.contactDetails.gender = gender
                newMem.contactDetails.phoneNumber = phoneNumber
                newMem.contactDetails.phoneCountryCode = phoneCountryCode
                newMem.email = email
                newMem.updatedPrivacy = updatedPrivacy
                newMem.updatedTerms = updatedTermsConsent
                newMem.preferences.marketing.newsletterEmail = newsletterConsent
                newMem.preferences.marketing.smsMms = smsConsent
                newMem.preferences.marketing.mail = mailConsent
                newMem.preferences.dataProfiling = profilingConsent
                newMem.preferences.marketingConsent = marketingConsent
                newMem.preferences.countryPreference = perferedCountry
                newMem.preferences.languagePreference = perferedLanguage
                newMem.stripeId = stripeId
                newMem.wixEmail = creds.wixEmail
                newMem.wixAuth = creds.wixAuth
                await encryptPass($w('#passwordInput').value)
                    .then((res) => {
                        if (res.status === 200) {
                            newMem.auth = res.messege
                        } else {
                            console.log(res.messege)
                            return
                        }
                    })
                    .catch((error) => {
                        console.log(error)
                        return
                    })
                //SETUP FIREBASE AUTH
                //console.log("ressss", res)
                firebaseRegistration(newMem.email, $w('#passwordInput').value, res.member.id)
                    .then((token) => {
                        //console.log(token)
                        if (token) {
                            signInWithCustomToken(getAuth(), token)
                                .then((res) => {
                                    //console.log("user", res)
                                    //console.log("newMem", newMem)
                                    wixData.insert("Members", newMem)
                                        .then((results) => {
                                            //console.log(results)
                                            wixLocation.to('/account')
                                        })
                                        .catch((err) => {
                                            let errorMsg = err;
                                            console.log(errorMsg)
                                        });
                                })

                        }
                    })
                    .catch((err) => {
                        let errorMsg = err;
                        console.log(errorMsg)
                    });

            } else {
                console.log("login failed")
                return
            }

        })
}

function thirdPartyRegistration() {

}

function googleSignin() {
    getAuthUrl()
        .then((result) => {
            const authorizationUrl = result.authUrl
            const state = result.state
            // store the state variable for later use
            session.setItem("requestState", state);
            session.setItem("requestOrgin", "registration");
            // direct the bowser to the authorization Url
            wixLocation.to(authorizationUrl);
        })
}

function registerWithFacebook() {

}

export function firstNameInput_input(event) {
    $w('#firstNameErrorText').collapse()
}

export function lasNameInput_input(event) {
    $w('#lastNameErrorText').collapse()
}

export function dOBMonthDropdown_change(event) {
    $w('#birthdayMonthErrorText').collapse()
}

export function dobDayDropdown_change(event) {
    $w('#birthdayDayErrorText').collapse()
}

export function dOBYearDropdown_change(event) {
    $w('#birthdayYearErrorText').collapse()
}

export function genderRadioGroup1_change(event) {
    if ($w('#genderRadioGroup2').value) {
        $w('#genderRadioGroup2').value = undefined
    }
    $w('#genderErrorText').collapse()
}

export function genderRadioGroup2_change(event) {
    if ($w('#genderRadioGroup1').value) {
        $w('#genderRadioGroup1').value = undefined
    }
    $w('#genderErrorText').collapse()
}

export function phoneAreaDropdown_change(event) {
    $w('#phoneAreaErrorText').collapse()
}

export function phoneInput_input(event) {
    $w('#PhoneNumberErrorText').collapse()
}

export function emailInput_input(event) {
    validateEmailInput($w('#emailInput').value, $w('#emailErrorText'), $w('#memberEmailCheck'))
}

export function passwordInput_input(event) {
    if (!$w('#passwordInput').value.match(passwordRegex)) {
        $w('#passwordErrorText').expand()
        $w('#passwordErrorText').text = "PASSWORD MUST BE A MINIMUM OF EIGHT CHARACTERS, AT LEAST ONE UPPER CASE ENGLISH LETTER, ONE LOWER CASE ENGLISH LETTER, ONE NUMBER AND ONE SPECIAL CHARACTER"
    } else {
        $w('#passwordErrorText').collapse()
    }
}
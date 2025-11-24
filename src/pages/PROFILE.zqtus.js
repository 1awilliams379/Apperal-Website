import wixMembers from 'wix-members';
import { local } from 'wix-storage'
import wixData from 'wix-data';

import { updateMemberPI, updateMemberPersonalInfoExpand, pWComp, updateMemberAddress, createPIntent, retrievePayMethod, removePayMethod, addMemberAddress, removeMemberAddress } from 'backend/account.jsw'
import { setAutocompleteSelection, phoneCountryCodes, usStates, countryListAlpha2, indiaStates } from 'public/shippingBack'
import { daysInMonthArr, yearsArr, monthsArr } from 'public/sitewide'
import { autocomplete, placeDetails } from 'backend/gmapsapi'
import { createToken, encodeCard } from "public/stripeAPI";

import { app } from "public/firebaseConfig";
import { getAuth } from 'firebase/auth'

var member, memberDetails
var memberAddresses
var phoneRegex = /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/
var emailRegex = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
var ddmmyyyyRegex = /(?:(?:31(\/|-|\.)(?:0?[13578]|1[02]))\1|(?:(?:29|30)(\/|-|\.)(?:0?[13-9]|1[0-2])\2))(?:(?:1[6-9]|[2-9]\d)?\d{2})$|^(?:29(\/|-|\.)0?2\3(?:(?:(?:1[6-9]|[2-9]\d)?(?:0[48]|[2468][048]|[13579][26])|(?:(?:16|[2468][048]|[3579][26])00))))$|^(?:0?[1-9]|1\d|2[0-8])(\/|-|\.)(?:(?:0?[1-9])|(?:1[0-2]))\4(?:(?:1[6-9]|[2-9]\d)?\d{2})/

var title, firstName, lastName, birthday, gender, phoneCountryCode, phoneNumber, email
var addressName, addressFirstName, addressLastName, addressLine1, addressLine2, addressCity, addressPostalCode, addressCountry, addressState, addressPhoneCountryCode, addressPhoneNumber
var addressFavorite
var addressSet = false
var userCountry
const countriesWithStatesAndRegions = ["US", "BR", "CA", "CN", "ET", "FM", "FR", "DE", "IN", "ID", "IT", "JP", "MM", "MX", "NG", "PW", "RU", "SS", "ZA", "ES", /*"GB",*/ "VN"];

$w.onReady(function () {
    setOnClicks()
    setPageData()
    handlePIchange()
    handleAddressChange()
    handlePaymentChange()
});

function setOnClicks() {
    $w('#personalInfoEditButton').onClick(() => {
        $w('#pIChangeSavedText').collapse()
        $w('#personalInfoEditBox').collapsed ? $w('#personalInfoEditBox').expand() && $w('#clientEmailBox').expand() : $w('#personalInfoEditBox').collapse()
        $w('#personalInfoBox').collapsed ? $w('#personalInfoBox').expand() : $w('#personalInfoBox').collapse()
    })

    $w('#changeEmailButton').onClick(() => {
        $w('#clientEmailBox').collapsed ? $w('#clientEmailBox').expand() : ($w('#clientEmailBox').collapse() && $w('#newEmailError').collapse() && $w('#confirmEmailError').collapse() && $w('#confirmEmailPAsswordError').collapse())
        $w('#newEmailBox').collapsed ? $w('#newEmailBox').expand() : $w('#newEmailBox').collapse()
    })

    $w('#cancelPersonalInfoEditButton').onClick(() => {
        $w('#personalInfoEditBox').collapsed ? $w('#personalInfoEditBox').expand() : $w('#personalInfoEditBox').collapse() && ($w('#clientEmailBox').expand() && $w('#newEmailBox').collapse() && $w('#newEmailError').collapse() && $w('#confirmEmailError').collapse() && $w('#confirmEmailPAsswordError').collapse() && $w('#box88').scrollTo())
        $w('#personalInfoBox').collapsed ? $w('#personalInfoBox').expand() : $w('#personalInfoBox').collapse()
        fillPI()
    })

    $w('#addNewAddressButton').onClick(() => {
        $w('#addNewAddressBox').collapsed ? $w('#addNewAddressBox').expand() && setAddressData() : $w('#addNewAddressBox').collapse()
        $w('#addNewAddressButtonBox').collapsed ? $w('#addNewAddressButtonBox').expand() : $w('#addNewAddressButtonBox').collapse()
    })

    $w('#cancelAddressEditButton').onClick(() => {
        $w('#addNewAddressBox').collapsed ? $w('#addNewAddressBox').expand() : $w('#addNewAddressBox').collapse()
        $w('#addNewAddressButtonBox').collapsed ? $w('#addNewAddressButtonBox').expand() : $w('#addNewAddressButtonBox').collapse()
    })
    $w('#addNewCardButton').onClick(() => {
        $w('#addNewCardEditBox').collapsed ? $w('#addNewCardEditBox').expand() : $w('#addNewCardEditBox').collapse()
        $w('#addNewCardButtonBox').collapsed ? $w('#addNewCardButtonBox').expand() : $w('#addNewCardButtonBox').collapse()
    })
    $w('#cancelAddNewCardButton').onClick(() => {
        $w('#addNewCardEditBox').collapsed ? $w('#addNewCardEditBox').expand() : $w('#addNewCardEditBox').collapse() && clearCardFields()
        $w('#addNewCardButtonBox').collapsed ? $w('#addNewCardButtonBox').expand() : $w('#addNewCardButtonBox').collapse()
    })

    $w('#confirmEmailPasswordShow').onClick(() => {
        $w('#confimEmailPassword').focus()
        if ($w('#confirmEmailPasswordShow').label === "SHOW") {
            $w('#confirmEmailPasswordShow').label = "HIDE"
            $w('#confimEmailPassword').inputType = "text";
        } else {
            $w('#confirmEmailPasswordShow').label = "SHOW"
            $w('#confimEmailPassword').inputType = "password";
        }
    })
}

function setPageData() {
    member = $w('#dynamicDataset').getCurrentItem()
    console.log("mem", member)
    wixData.get("Members", member._id)
        .then((mem) => {
            memberDetails = mem
            console.log("mem dets", memberDetails)
            fillPI()
            if (memberDetails.contactDetails.addresses.choices !== 0) {
                setAddressRepeater()
            }
            if (memberDetails.paymentMethods !== 0) {
                setPaymentMethodRepeater()
            }
        })
        .catch((err) => {
            console.log(err)
        })
}

function fillPI() {
    memberDetails.contactDetails.title ? $w('#pINameText').text = memberDetails.contactDetails.title + " " + member.name : $w('#pINameText').text = member.name
    $w('#pIPhoneText').text = "+" + memberDetails.contactDetails.phoneCountryCode.toString() + memberDetails.contactDetails.phoneNumber.toString()
    $w('#pIDOBText').text = dobFormat(memberDetails.contactDetails.birthday)
    $w('#pIGenderText').text = memberDetails.contactDetails.gender
    $w('#pIFirstNameInput').value = memberDetails.contactDetails.firstName
    $w('#pILastNameInput').value = memberDetails.contactDetails.lastName
    $w('#pIPhoneInput').value = memberDetails.contactDetails.phoneNumber
    $w('#pIEmailText').text = memberDetails.email
    $w('#clientEmailText').text = memberDetails.email
    setPhoneDropdown(memberDetails.contactDetails.phoneCountryCode.toString())
    setDOBDropdown(memberDetails.contactDetails.birthday)
    setTitleDropdown()
    setGender()
}

function setPhoneDropdown(cc) {
    let arr = phoneCountryCodes.map((item, index) => {
        return {
            label: "+" + item.code,
            value: item.name
        }
    })
    $w('#pIPhoneAreaDropdown').options = arr

    for (var country in arr) {
        if (cc === arr[country].label.replace("+", "")) {
            let index = parseInt(country)
            $w('#pIPhoneAreaDropdown').selectedIndex = index
            break
        }
    }

}

function setDOBDropdown(fulldob) {
    let splitdob = fulldob.split('-')
    let yarr = yearsArr.map((item, index) => {
        return {
            label: item,
            value: item
        }
    })
    $w('#pIDOBYearDropdown').options = yarr

    for (var dob in yarr) {
        if (splitdob[2] === yarr[dob].value) {
            $w('#pIDOBYearDropdown').selectedIndex = parseInt(dob)
            break
        }
    }

    let marr = monthsArr.map((item, index) => {
        return {
            label: item,
            value: item
        }
    })
    $w('#pIDOBMonthDropdown').options = marr

    for (var dob in marr) {
        if (splitdob[1] === marr[dob].value) {
            $w('#pIDOBMonthDropdown').selectedIndex = parseInt(dob)
            break
        }
    }

    let darr = daysInMonthArr.map((item, index) => {
        return {
            label: item,
            value: item
        }
    })
    $w('#pIDOBDsyDropdown').options = darr

    for (var dob in darr) {
        if (splitdob[0] === darr[dob].value) {
            $w('#pIDOBDsyDropdown').selectedIndex = parseInt(dob)
            break
        }
    }
}

function setTitleDropdown() {
    if (memberDetails.contactDetails.title) {
        for (var option in $w('#pITitleDropdown').options) {
            if (memberDetails.contactDetails.title === $w('#pITitleDropdown').options[option].value) {
                $w('#pITitleDropdown').selectedIndex = parseInt(option)
                break
            }
        }
    }
}

function setGender() {
    let gen = memberDetails.contactDetails.gender
    for (var option in $w('#genderRadioGroup1').options) {
        if (gen === $w('#genderRadioGroup1').options[option].value) {
            $w('#genderRadioGroup1').selectedIndex = parseInt(option)
            break
        }
        if (gen === $w('#genderRadioGroup2').options[option].value) {
            $w('#genderRadioGroup2').selectedIndex = parseInt(option)
            break
        }
    }
}

function dobFormat(fulldob) {
    var dob
    console.log(fulldob)
    let splitdob = fulldob.split('-')
    if (splitdob[1] === "01") {
        dob = "January " + splitdob[0] + ", " + splitdob[2]
    }
    if (splitdob[1] === "02") {
        dob = "February " + splitdob[0] + ", " + splitdob[2]
    }
    if (splitdob[1] === "03") {
        dob = "March " + splitdob[0] + ", " + splitdob[2]
    }
    if (splitdob[1] === "04") {
        dob = "April " + splitdob[0] + ", " + splitdob[2]
    }
    if (splitdob[1] === "05") {
        dob = "May " + splitdob[0] + ", " + splitdob[2]
    }
    if (splitdob[1] === "06") {
        dob = "June " + splitdob[0] + ", " + splitdob[2]
    }
    if (splitdob[1] === "07") {
        dob = "July " + splitdob[0] + ", " + splitdob[2]
    }
    if (splitdob[1] === "08") {
        dob = "August " + splitdob[0] + ", " + splitdob[2]
    }
    if (splitdob[1] === "09") {
        dob = "September " + splitdob[0] + ", " + splitdob[2]
    }
    if (splitdob[1] === "09") {
        dob = "September " + splitdob[0] + ", " + splitdob[2]
    }
    if (splitdob[1] === "10") {
        dob = "October " + splitdob[0] + ", " + splitdob[2]
    }
    if (splitdob[1] === "11") {
        dob = "November " + splitdob[0] + ", " + splitdob[2]
    }
    if (splitdob[1] === "12") {
        dob = "December " + splitdob[0] + ", " + splitdob[2]
    }

    return dob
}

function handlePIchange() {

    $w('#savePersonalInfoButton').onClick(async () => {
        if (!$w('#pIFirstNameInput').value) {
            $w('#piFirstNameError').expand()
            $w('#piFirstNameError').text = "PLEASE ENTER A VALID FIRST NAME"
        }
        if (!$w('#pILastNameInput').value) {
            $w('#pILastNameError').expand()
            $w('#pILastNameError').text = "PLEASE ENTER A VALID LAST NAME"
        }
        if (!$w('#pIDOBYearDropdown').value) {
            $w('#pIDOBYearError').expand()
            $w('#pIDOBYearError').text = "PLEASE SELECT A VALUE FROM THE LIST"
        }
        if (!$w('#pIDOBMonthDropdown').value) {
            $w('#pIDOBMonthError').expand()
            $w('#pIDOBMonthError').text = "PLEASE SELECT A VALUE FROM THE LIST"
        }
        if (!$w('#pIDOBDsyDropdown').value) {
            $w('#pIDOBDsyError').expand()
            $w('#pIDOBDsyError').text = "PLEASE SELECT A VALUE FROM THE LIST"
        }
        if (!$w('#genderRadioGroup1').value && !$w('#genderRadioGroup2').value) {
            $w('#genderErrorText').expand()
            $w('#genderErrorText').text = "PLEASE SELECT A VALUE"
        }
        if (!$w('#pIPhoneAreaDropdown').value) {
            $w('#pIPhoneAreaErrorText').expand()
            $w('#pIPhoneAreaErrorText').text = "PLEASE SELECT A VALUE FROM THE LIST"
        }
        if (!$w('#pIPhoneInput').value) {
            $w('#pIPhoneErrorText').expand()
            $w('#pIPhoneErrorText').text = "PHONE NUMBER REQUIRED"
        }
        if (!$w('#pIPhoneInput').value.match(phoneRegex)) {
            $w('#pIPhoneErrorText').expand()
            $w('#pIPhoneErrorText').text = "PLEASE ENTER A VALID PHONE NUMBER"
        }
        birthday = $w('#pIDOBDsyDropdown').value + "-" + $w('#pIDOBMonthDropdown').value + "-" + $w('#pIDOBYearDropdown').value
        if (!birthday.match(ddmmyyyyRegex)) {
            $w('#pIDOBMonthError').text = "PLEASE ENTER A VALID DATE"
        }
        if (!$w('#newEmailBox').collapsed) {
            if (!$w('#newEmailInput').value.match(emailRegex)) {
                $w('#newEmailError').expand()
                $w('#newEmailError').text = "PLEASE ENTER A VALID E-MAIL ADDRESS"
            }
            if (!$w('#confirmEmailInput').value.match($w('#newEmailInput').value)) {
                $w('#confirmEmailError').expand()
                $w('#confirmEmailError').text = "EMAIL MUST MATCH"
            }
            if (!$w('#confimEmailPassword').value) {
                $w('#confirmEmailPAsswordError').expand()
                $w('#confirmEmailPAsswordError').text = "PASSWORD REQUIRED"
            }
            if ($w('#confirmEmailInput').value !== $w('#newEmailInput').value) {
                $w('#confirmEmailError').expand()
                $w('#confirmEmailError').text = "EMAIL DOES NOT MATCH"
            }
            await validateEmailPassword($w('#confimEmailPassword').value, memberDetails.auth)
                .then((res) => {
                    if (!res) {
                        $w('#confirmEmailPAsswordError').expand()
                        $w('#confirmEmailPAsswordError').text = "PASSWORD VALIDATION FAILED"
                    }
                })
        }

        if ($w('#piFirstNameError').collapsed &&
            $w('#pILastNameError').collapsed &&
            $w('#pIDOBYearError').collapsed &&
            $w('#pIDOBMonthError').collapsed &&
            $w('#pIDOBDsyError').collapsed &&
            $w('#genderErrorText').collapsed &&
            $w('#pIPhoneAreaErrorText').collapsed &&
            $w('#pIPhoneErrorText').collapsed &&
            $w('#newEmailError').collapsed &&
            $w('#confirmEmailError').collapsed &&
            $w('#confirmEmailPAsswordError').collapsed) {
            savePersonalInfoEdits()
        } else {
            console.log("errorPresent")
            return
        }
    })

}

function validateEmailPassword(pw, ha) {
    return pWComp(pw, ha)
        .then((res) => {
            return res
        })
        .catch((error) => {
            console.log(error)
        })
}

export function pIFirstNameInput_input(event) {
    $w('#piFirstNameError').collapse()
}

export function pILastNameInput_input(event) {
    $w('#pILastNameError').collapse()
}

export function pIDOBMonthDropdown_change(event) {
    $w('#pIDOBMonthError').collapse()
}

export function pIDOBDsyDropdown_change(event) {
    $w('#pIDOBDsyError').collapse()
}

export function pIDOBYearDropdown_change(event) {
    $w('#pIDOBYearError').collapse()
}

export function genderRadioGroup1_change(event) {
    $w('#genderRadioGroup2').value = undefined
    $w('#genderErrorText').collapse()
}

export function genderRadioGroup2_change(event) {
    $w('#genderRadioGroup1').value = undefined
    $w('#genderErrorText').collapse()
}

export function pIPhoneAreaDropdown_change(event) {
    $w('#pIPhoneAreaErrorText').collapse()
}

export function pIPhoneInput_input(event) {
    $w('#pIPhoneErrorText').collapse()
}

export function newEmailInput_input(event) {
    $w('#newEmailError').collapse()
    $w('#confirmEmailError').collapse()
    if (!$w('#newEmailBox').collapsed) {
        if (!$w('#newEmailInput').value.match(emailRegex)) {
            $w('#newEmailError').expand()
            $w('#newEmailError').text = "PLEASE ENTER A VALID E-MAIL ADDRESS"
        }
        if ($w('#confirmEmailInput').value !== $w('#newEmailInput').value && $w('#confirmEmailInput').value.length !== 0) {
            $w('#confirmEmailError').expand()
            $w('#confirmEmailError').text = "E-MAIL MUST MATCH"
        }
    }

}

export function confirmEmailInput_input(event) {
    $w('#confirmEmailError').collapse()
    $w('#newEmailError').collapse()
    if (!$w('#newEmailBox').collapsed) {
        if (!$w('#newEmailInput').value.match(emailRegex)) {
            $w('#newEmailError').expand()
            $w('#newEmailError').text = "PLEASE ENTER A VALID E-MAIL ADDRESS"
        }
        if ($w('#confirmEmailInput').value !== $w('#newEmailInput').value) {
            $w('#confirmEmailError').expand()
            $w('#confirmEmailError').text = "E-MAIL MUST MATCH"
        }
    }
}

export function confimEmailPassword_input(event) {
    $w('#confirmEmailPAsswordError').collapse()
}

async function savePersonalInfoEdits() {
    if ($w('#pITitleDropdown').value) {
        title = $w('#pITitleDropdown').value
    }
    firstName = $w('#pIFirstNameInput').value
    lastName = $w('#pILastNameInput').value
    if ($w('#genderRadioGroup1').value) {
        gender = $w('#genderRadioGroup1').value
    }
    if ($w('#genderRadioGroup2').value) {
        gender = $w('#genderRadioGroup2').value
    }
    phoneCountryCode = $w('#pIPhoneAreaDropdown').options[$w('#pIPhoneAreaDropdown').selectedIndex].label.replace("+", "")
    phoneNumber = $w('#pIPhoneInput').value
    if (!$w('#newEmailBox').collapsed) {
        email = $w('#newEmailInput').value
    }

    let toUpdate = {
        "title": undefined,
        "firstName": undefined,
        "lastName": undefined,
        "birthday": undefined,
        "gender": undefined,
        "phoneCountryCode": undefined,
        "phoneNumber": undefined,
        "email": undefined,
        "id": member._id
    }
    if (title !== memberDetails.contactDetails.title) {
        toUpdate.title = title
    }
    if (firstName !== memberDetails.contactDetails.firstName) {
        toUpdate.firstName = firstName
    }
    if (lastName !== memberDetails.contactDetails.lastName) {
        toUpdate.lastName = lastName
    }
    if (birthday !== memberDetails.contactDetails.birthday) {
        //console.log(birthday, memberDetails.contactDetails.birthday)
        toUpdate.birthday = birthday
    }
    if (gender !== memberDetails.contactDetails.gender) {
        toUpdate.gender = gender
    }
    if (phoneCountryCode !== memberDetails.contactDetails.phoneCountryCode) {
        toUpdate.phoneCountryCode = phoneCountryCode
    }
    if (phoneNumber !== memberDetails.contactDetails.phoneNumber) {
        toUpdate.phoneNumber = phoneNumber
    }
    if (email !== memberDetails.contactDetails.email) {
        toUpdate.email = email
    }
    if (!toUpdate.title &&
        !toUpdate.firstName &&
        !toUpdate.lastName &&
        !toUpdate.birthday &&
        !toUpdate.gender &&
        !toUpdate.phoneCountryCode &&
        !toUpdate.phoneNumber &&
        !toUpdate.email) {
        return
    } else {
        //console.log("toUpdate", toUpdate)
        await updateMemberPI(toUpdate)
            .then((res) => {
                //console.log("res", res)
                if (res) {
                    updateMemberPersonalInfoExpand(toUpdate, memberDetails)
                        .then((res) => {
                            console.log(res)
                            if (res) {
                                //console.log('Update Successful')
                                $w('#dynamicDataset').refresh()
                                    .then(() => {
                                        memberDetails = res
                                        $w('#accountHoverName').text = memberDetails.contactDetails.firstName + " " + memberDetails.contactDetails.lastName
                                        title = undefined, firstName = undefined, lastName = undefined, birthday = undefined, gender = undefined, phoneCountryCode = undefined, phoneNumber = undefined, email = undefined
                                        $w('#clientEmailBox').expand()
                                        $w('#personalInfoEditBox').collapse()
                                        $w('#newEmailBox').collapse()
                                        $w('#pIChangeSavedText').expand()
                                        $w('#personalInfoBox').expand()
                                        $w('#newEmailInput').value = undefined
                                        $w('#confirmEmailInput').value = undefined
                                        $w('#confimEmailPassword').value = undefined
                                        $w('#box88').scrollTo()
                                        setPageData()
                                    })
                            }
                        })
                }
            })
    }
}

function setAddressData() {
    if (!addressSet) {
        //userCountry = memberDetails.preferences.countryPreference
        let startcountry = local.getItem("userCountry");
        userCountry = startcountry.split('~')
        setAddressPhoneDropdown()
        setStateDropdown(userCountry[0])
        setCountryDropdown()
        addressSet = true
    }
}

function setAddressRepeater() {
    $w('#storedAddressesBox').expand()
    $w('#savedAddressRepeater').expand()
    const addys = memberDetails.contactDetails.addresses.choices.map((item, index) => {
        //console.log(memberDetails.contactDetails.addresses.choices)
        var key = Object.keys(item)[0]
        //console.log(item, key, index)
        return {
            _id: item[key].id,
            name: Object.keys(item)[0],
            firstName: item[key].firstName,
            lastName: item[key].lastName,
            line1: item[key].line1,
            line2: item[key].line2,
            city: item[key].city,
            state: item[key].state,
            country: item[key].country,
            postal: item[key].postal,
            phoneCountryCode: item[key].phoneCountryCode,
            phoneNumber: item[key].phoneNumber,
        }
    })
    $w('#savedAddressRepeater').data = []
    $w('#savedAddressRepeater').data = addys

}

export function savedAddressRepeater_itemReady($item, $itemData, index) {
    readySavedAddressRepeater($item, $itemData)
}

function readySavedAddressRepeater($item, $itemData) {
    $item('#favoriteAddessLabel').collapse()
    $item('#savedAddressNAmeText').text = $itemData.name
    $item('#savedAddressBox').onClick(() => {
        if ($item('#viewSavedAddressBox').collapsed && $item('#editSavedAddressBox').collapsed && $item('#deleteSavedAddressBox').collapsed) {
            $w('#savedAddressRepeater').forEachItem(($ite, $iteData, i) => {
                const arr = $ite('#viewSavedAddressBox')
                $ite('#addressShowHideText').text = "SHOW"
                arr.collapse()
                $ite('#editSavedAddressBox').collapse()
                $ite('#deleteSavedAddressBox').collapse()
                $ite('#savedAddressNAmeText').text = $iteData.name
            })
            $item('#viewSavedAddressBox').expand();
            $item('#addressShowHideText').text = "HIDE"
            //description.collapsed ? description.expand() : description.collapse();
        } else {
            $item('#addressShowHideText').text = "SHOW"
            $item('#viewSavedAddressBox').collapse()
            $item('#editSavedAddressBox').collapse()
            $item('#deleteSavedAddressBox').collapse()
            $item('#savedAddressNAmeText').text = $itemData.name
        }

        $item('#editSavedAddressButton').onClick(() => {
            console.log($itemData.country)
            layoutEditBasedOffCoutntry($itemData.country, $itemData.state, $item)
            $item('#savedAddressNAmeText').text = "Edit " + $itemData.name + " Address"
            $item('#viewSavedAddressBox').collapse()
            $item('#editSavedAddressBox').expand()
            $item('#editSavedAddressTitleInput').value = $itemData.name
            $item('#editSavedAddressFirstNameInput').value = $itemData.firstName
            $item('#editSavedAddressLastNameInput').value = $itemData.lastName
            $item('#editSavedAddressLine1Input').value = $itemData.line1
            $item('#editSavedAddressLine2Input').value = $itemData.line2
            $item('#editSavedAddressPhoneDropdown').value = $itemData.phoneNumber
            $item('#editSavedAddressPostalCodeInput').value = $itemData.postal
            $item('#editSavedAddressCityInput').value = $itemData.city

            let startcountry = local.getItem("userCountry");
            userCountry = startcountry.split('~')
            setAddressPhoneEditDropdown($itemData.phoneCountryCode)
            setCountryEditDropdown($itemData.country, $item)

            if ($itemData.name === memberDetails.contactDetails.addresses.favorite) {
                $item('#editSavedAddressFavoriteCheckbox').checked = true
                $item('#favoriteAddessLabel').expand()
            } else {
                $item('#favoriteAddessLabel').collapse()
            }
        })

        $item('#removeSavedAddressButton').onClick(() => {
            $item('#savedAddressNAmeText').text = "Confirm you want to remove " + $itemData.name + "?"
            $item('#viewSavedAddressBox').collapse()
            $item('#deleteSavedAddressBox').expand()
            $item('#addressBox').scrollTo()
        })
        $item('#noDontRemoveSavedAddressButton').onClick(() => {
            $item('#viewSavedAddressBox').expand();
            $item('#editSavedAddressBox').collapse()
            $item('#deleteSavedAddressBox').collapse()
            $item('#savedAddressNAmeText').text = $itemData.name
            $item('#addressBox').scrollTo()
        })
        $item('#yesRemoveSavedAddressButton').onClick(() => {
            removeSavedAddress($itemData._id)
            $item('#addressBox').scrollTo()
        })
        $item('#cancelEditSavedAddressButton').onClick(() => {
            $item('#addressShowHideText').text = "SHOW"
            $item('#viewSavedAddressBox').collapse()
            $item('#editSavedAddressBox').collapse()
            $item('#deleteSavedAddressBox').collapse()
            $item('#savedAddressNAmeText').text = $itemData.name
            $item('#addressBox').scrollTo()
        })

        $item('#editSavedAddressSaveChangesButton').onClick(() => {
            handleAddressUpdate($item, $itemData)
        })
    })

    if (memberDetails.contactDetails.addresses.favorite === $itemData.name) {
        $item('#favoriteAddessLabel').expand()
    } else {
        $item('#favoriteAddessLabel').collapse()
    }
    $item('#viewSavedAddressName').text = $itemData.firstName + " " + $itemData.lastName
    $item('#viewSavedAddressStreet').text = $itemData.line1
    if ($itemData.line2) {
        $item('#viewSavedAddressStreet').text = $item('#viewSavedAddressStreet').text + " " + $itemData.line2
    }
    $item('#viewSavedAddressRestOfAddy').text = $itemData.city + " " + $itemData.state + " " + $itemData.postal + " " + $itemData.country
    $item('#viewSavedAddressPhone').text = "+" + $itemData.phoneCountryCode + " " + $itemData.phoneNumber
}

function handleAddressChange() {
    $w('#saveNewAddressButton').onClick(async () => {
        if (!$w('#addressTitleInput').value) {
            $w('#addressTitleErrorMessege').expand()
            $w('#addressTitleErrorMessege').text = "PLEASE ENTER A VALID NAME"
        }
        if (!$w('#addressFirstNameInput').value) {
            $w('#addressFirstNameErrorMessege').expand()
            $w('#addressFirstNameErrorMessege').text = "PLEASE ENTER A VALID NAME"
        }
        if (!$w('#addressLastNameInput').value) {
            $w('#addressLastNameError').expand()
            $w('#addressLastNameError').text = "PLEASE ENTER A VALID NAME"
        }
        if (!$w('#addressLastNameInput').value) {
            $w('#addressLastNameError').expand()
            $w('#addressLastNameError').text = "PLEASE ENTER A VALID NAME"
        }
        if (!$w('#addressLine1Input').value) {
            $w('#addressLine1Error').expand()
            $w('#addressLine1Error').text = "ADDRESS REQUIRED"
        }
        if (!$w('#addressCityInput').value) {
            $w('#addressCityError').expand()
            $w('#addressCityError').text = "CITY REQUIRED"
        }
        if (!$w('#addressStateDropdown').value) {
            $w('#addressStateError').expand()
            $w('#addressStateError').text = "PLEASE SELECT A VALUE FROM THE LIST"
        }
        if (!$w('#addressPhoneCountryCodeDropdown').value) {
            $w('#addressPhoneCountryCodeError').expand()
            $w('#addressPhoneCountryCodeError').text = "PLEASE SELECT A VALUE FROM THE LIST"
        }
        if (!$w('#addressPostalCodeInput').value) {
            $w('#addressPostalCodeError').expand()
            $w('#addressPostalCodeError').text = "POSTAL CODE REQUIRED"
        }
        if (!$w('#addressPhoneNumberInput').value) {
            $w('#addressPhoneNumberError').expand()
            $w('#addressPhoneNumberError').text = "PHONE NUMBER REQUIRED"
        }
        if ($w('#addressTitleErrorMessege').collapsed &&
            $w('#piFirstNameError').collapsed &&
            $w('#pILastNameError').collapsed &&
            $w('#addressLine1Error').collapsed &&
            $w('#addressCityError').collapsed &&
            $w('#addressStateError').collapsed &&
            $w('#addressCountryError').collapsed &&
            $w('#addressPostalCodeError').collapsed &&
            $w('#addressPhoneCountryCodeError').collapsed &&
            $w('#addressPhoneNumberError').collapsed) {
            saveNewAddress()
        }
    })
}

function handleAddressUpdate($item, oldAddress) {
    if (!$item('#editSavedAddressTitleInput').value) {
        $item('#editSavedAddressTitleError').expand()
        $item('#editSavedAddressTitleError').text = "PLEASE ENTER A VALID NAME"
    }
    if (!$item('#editSavedAddressFirstNameInput').value) {
        $item('#editSavedAddressFirstNameError').expand()
        $item('#editSavedAddressFirstNameError').text = "PLEASE ENTER A VALID NAME"
    }
    if (!$item('#editSavedAddressLastNameInput').value) {
        $item('#editSavedAddressLastNameError').expand()
        $item('#editSavedAddressLastNameError').text = "PLEASE ENTER A VALID NAME"
    }
    if (!$item('#editSavedAddressLine1Input').value) {
        $item('#editSavedAddressLine1Error').expand()
        $item('#editSavedAddressLine1Error').text = "ADDRESS REQUIRED"
    }
    if (!$item('#editSavedAddressCityInput').value) {
        $item('#editSavedAddressCityError').expand()
        $item('#editSavedAddressCityError').text = "CITY REQUIRED"
    }
    if (!$item('#editSavedAddressStateDropdown').value) {
        $item('#editSavedStateStateErrorText').expand()
        $item('#editSavedStateStateErrorText').text = "PLEASE SELECT A VALUE FROM THE LIST"
    }
    if (!$item('#editSavedAddressPhoneAreaDropdown').value) {
        $item('#editSavedAddressPhoneAreaError').expand()
        $item('#editSavedAddressPhoneAreaError').text = "PLEASE SELECT A VALUE FROM THE LIST"
    }
    if (!$item('#editSavedAddressPostalCodeInput').value) {
        $item('#editSavedAddressPostalCodeError').expand()
        $item('#editSavedAddressPostalCodeError').text = "POSTAL CODE REQUIRED"
    }
    if (!$item('#editSavedAddressPhoneDropdown').value) {
        $item('#editSavedAddresPhoneError').expand()
        $item('#editSavedAddresPhoneError').text = "PHONE NUMBER REQUIRED"
    }
    if (!$item('#editSavedAddressCountryDropDown').value) {
        $item('#editSavedAddressCountryErrorText').expand()
        $item('#editSavedAddressCountryErrorText').text = "PLEASE SELECT A VALUE FROM THE LIST"
    }
    if ($item('#editSavedAddressTitleError').collapsed &&
        $item('#editSavedAddressFirstNameError').collapsed &&
        $item('#editSavedAddressLastNameError').collapsed &&
        $item('#editSavedAddressLine1Error').collapsed &&
        $item('#editSavedAddressCityError').collapsed &&
        $item('#editSavedAddressCountryErrorText').collapsed &&
        $item('#editSavedStateStateErrorText').collapsed &&
        $item('#editSavedAddressPhoneAreaError').collapsed &&
        $item('#editSavedAddressPostalCodeError').collapsed &&
        $item('#editSavedAddresPhoneError').collapsed) {
        updateAddress($item, oldAddress)
    }
}

function setAddressPhoneDropdown() {
    let arr = phoneCountryCodes.map((item, index) => {
        return {
            label: "+" + item.code,
            value: item.name
        }
    })
    $w('#addressPhoneCountryCodeDropdown').options = arr

    for (var country in arr) {
        if (userCountry[1] === arr[country].value) {
            let index = parseInt(country)
            $w('#addressPhoneCountryCodeDropdown').selectedIndex = index
            break
        }
    }

}

function setCountryDropdown() {
    layoutBasedOffCoutntry(userCountry[0])
    countryListAlpha2.sort((a, b) => a.countryName.toLowerCase() > b.countryName.toLowerCase() ? 1 : -1);
    let arr = countryListAlpha2.map((item, index) => {
        return {
            label: item.countryName,
            value: item.countryCode
        }
    })
    $w('#addressCountryDropdown').options = arr

    for (var country in arr) {
        if (userCountry[1] === arr[country].label) {
            let index = parseInt(country)
            $w('#addressCountryDropdown').selectedIndex = index
            break
        }
    }
}

function setAddressPhoneEditDropdown(selectedArea) {
    let arr = phoneCountryCodes.map((item, index) => {
        return {
            label: "+" + item.code,
            value: item.name
        }
    })
    $w('#editSavedAddressPhoneAreaDropdown').options = arr

    for (var country in arr) {
        if (("+" + selectedArea) === arr[country].label) {
            let index = parseInt(country)
            $w('#editSavedAddressPhoneAreaDropdown').selectedIndex = index
            break
        }
    }

}

function setCountryEditDropdown(selectedCountry, item) {
    //layoutEditBasedOffCoutntry(item('#editSavedAddressCountryDropDown').value)
    countryListAlpha2.sort((a, b) => a.countryName.toLowerCase() > b.countryName.toLowerCase() ? 1 : -1);
    let arr = countryListAlpha2.map((item, index) => {
        return {
            label: item.countryName,
            value: item.countryCode
        }
    })
    item('#editSavedAddressCountryDropDown').options = arr

    for (var country in arr) {
        if (selectedCountry === arr[country].value) {
            let index = parseInt(country)
            item('#editSavedAddressCountryDropDown').selectedIndex = index
            break
        }
    }
}

async function saveNewAddress() {
    addressFavorite = undefined, addressName = undefined, addressFirstName = undefined, addressLastName = undefined, addressLine1 = undefined, addressLine2 = undefined, addressCity = undefined, addressPostalCode = undefined, addressCountry = undefined, addressState = undefined, addressPhoneCountryCode = undefined, addressPhoneNumber = undefined
    await wixMembers.currentMember.getMember()
        .then(async (meme) => {
            console.log("meme", meme)
            memberAddresses = meme.contactDetails.addresses
            addressName = $w('#addressTitleInput').value
            addressFirstName = $w('#addressFirstNameInput').value
            addressLastName = $w('#addressLastNameInput').value
            addressLine1 = $w('#addressLine1Input').value
            if ($w('#addresssLine2Input').value) {
                addressLine2 = $w('#addresssLine2Input').value
            } else {
                addressLine2 = undefined
            }
            addressCity = $w('#addressCityInput').value
            addressState = $w('#addressStateDropdown').value
            addressPostalCode = $w('#addressPostalCodeInput').value
            addressCountry = $w('#addressCountryDropdown').value
            addressPhoneCountryCode = $w('#addressPhoneCountryCodeDropdown').options[$w('#addressPhoneCountryCodeDropdown').selectedIndex].label.replace("+", "")
            addressPhoneNumber = $w('#addressPhoneNumberInput').value
            addressFavorite = $w('#favoriteAddresCheckbox').checked
            let toUpdate = {
                "title": undefined,
                "firstName": undefined,
                "lastName": undefined,
                "line1": undefined,
                "line2": undefined,
                "phoneCountryCode": undefined,
                "phoneNumber": undefined,
                "city": undefined,
                "state": undefined,
                "postal": undefined,
                "country": undefined,
                "favorite": undefined,
                "id": member._id,
                "addressId": undefined
            }
            if (memberDetails.contactDetails.addresses.choices.length !== 0) {
                for (var add in memberDetails.contactDetails.addresses.choices) {
                    var addyTitle = Object.keys(memberDetails.contactDetails.addresses.choices[add])[0]
                    if (addyTitle === $w('#addressTitleInput').value) {
                        console.log('Address Name already saved')
                        return
                    }
                    if (memberDetails.contactDetails.addresses.choices[add][addyTitle].line1 === addressLine1 &&
                        memberDetails.contactDetails.addresses.choices[add][addyTitle].line2 === addressLine2 &&
                        memberDetails.contactDetails.addresses.choices[add][addyTitle].city === addressCity &&
                        memberDetails.contactDetails.addresses.choices[add][addyTitle].state === addressState &&
                        memberDetails.contactDetails.addresses.choices[add][addyTitle].postal === addressPostalCode &&
                        memberDetails.contactDetails.addresses.choices[add][addyTitle].phoneCountryCode === addressPhoneCountryCode &&
                        memberDetails.contactDetails.addresses.choices[add][addyTitle].phoneNumber === addressPhoneNumber) {
                        console.log('Address already saved')
                        return
                    }

                }

                toUpdate.title = addressName
                toUpdate.firstName = addressFirstName
                toUpdate.lastName = addressLastName
                toUpdate.line1 = addressLine1
                toUpdate.line2 = addressLine2
                toUpdate.city = addressCity
                toUpdate.state = addressState
                toUpdate.country = addressCountry
                toUpdate.postal = addressPostalCode
                toUpdate.phoneCountryCode = addressPhoneCountryCode
                toUpdate.phoneNumber = addressPhoneNumber
                toUpdate.favorite = addressFavorite
            } else {
                toUpdate.title = addressName
                toUpdate.firstName = addressFirstName
                toUpdate.lastName = addressLastName
                toUpdate.line1 = addressLine1
                toUpdate.line2 = addressLine2
                toUpdate.city = addressCity
                toUpdate.state = addressState
                toUpdate.country = addressCountry
                toUpdate.postal = addressPostalCode
                toUpdate.phoneCountryCode = addressPhoneCountryCode
                toUpdate.phoneNumber = addressPhoneNumber
            }
            if (!toUpdate.title &&
                !toUpdate.firstName &&
                !toUpdate.lastName &&
                !toUpdate.line1 &&
                !toUpdate.line2 &&
                !toUpdate.phoneCountryCode &&
                !toUpdate.phoneNumber &&
                !toUpdate.city &&
                !toUpdate.state &&
                !toUpdate.country &&
                !toUpdate.postal) {
                return
            } else {
                await addMemberAddress(toUpdate, memberAddresses, memberDetails)
                    .then((res) => {
                        console.log("res", res)
                        if (res) {
                            console.log('Add Successful')
                            $w('#dynamicDataset').refresh()
                                .then(() => {
                                    memberDetails = res
                                    addressFavorite = undefined, addressName = undefined, addressFirstName = undefined, addressLastName = undefined, addressLine1 = undefined, addressLine2 = undefined, addressCity = undefined, addressPostalCode = undefined, addressCountry = undefined, addressState = undefined, addressPhoneCountryCode = undefined, addressPhoneNumber = undefined
                                    $w('#addressTitleInput').value = undefined
                                    $w('#addressFirstNameInput').value = undefined
                                    $w('#addressLastNameInput').value = undefined
                                    $w('#addressLine1Input').value = undefined
                                    $w('#addresssLine2Input').value = undefined
                                    $w('#addressCityInput').value = undefined
                                    $w('#addressStateDropdown').value = undefined
                                    $w('#addressPostalCodeInput').value = undefined
                                    $w('#addressPhoneNumberInput').value = undefined
                                    setAddressPhoneDropdown()
                                    setCountryDropdown()
                                    $w('#favoriteAddresCheckbox').checked = false
                                    $w('#addNewAddressBox').collapse()
                                    $w('#savedAddressRepeater').expand()
                                    $w('#storedAddressesBox').expand()
                                    $w('#addressUpdatedSaved').expand()
                                    $w('#addNewAddressButtonBox').expand()
                                    setAddressRepeater()
                                    $w('#storedAddressesBox').scrollTo()
                                })
                        }
                    })
            }
        })

}

async function updateAddress($item, oldAddy) {
    addressFavorite = undefined, addressName = undefined, addressFirstName = undefined, addressLastName = undefined, addressLine1 = undefined, addressLine2 = undefined, addressCity = undefined, addressPostalCode = undefined, addressCountry = undefined, addressState = undefined, addressPhoneCountryCode = undefined, addressPhoneNumber = undefined
    await wixMembers.currentMember.getMember()
        .then(async (meme) => {
            console.log("meme", meme)
            memberAddresses = meme.contactDetails.addresses
            addressName = $item('#editSavedAddressTitleInput').value
            addressFirstName = $item('#editSavedAddressFirstNameInput').value
            addressLastName = $item('#editSavedAddressLastNameInput').value
            addressLine1 = $item('#editSavedAddressLine1Input').value
            if ($item('#editSavedAddressLine2Input').value) {
                addressLine2 = $item('#editSavedAddressLine2Input').value
            } else {
                addressLine2 = undefined
            }
            addressCity = $item('#editSavedAddressCityInput').value
            addressState = $item('#editSavedAddressStateDropdown').value
            addressPostalCode = $item('#editSavedAddressPostalCodeInput').value
            addressCountry = $item('#editSavedAddressCountryDropDown').value
            addressPhoneCountryCode = $item('#editSavedAddressPhoneAreaDropdown').options[$item('#editSavedAddressPhoneAreaDropdown').selectedIndex].label.replace("+", "")
            addressPhoneNumber = $item('#editSavedAddressPhoneDropdown').value
            addressFavorite = $item('#editSavedAddressFavoriteCheckbox').checked

            let toUpdate = {
                "title": oldAddy.name,
                "firstName": oldAddy.firstName,
                "lastName": oldAddy.lastName,
                "line1": oldAddy.line1,
                "line2": oldAddy.line2,
                "phoneCountryCode": oldAddy.phoneCountryCode,
                "phoneNumber": oldAddy.phoneNumber,
                "city": oldAddy.city,
                "state": oldAddy.state,
                "postal": oldAddy.postal,
                "country": oldAddy.country,
                "favorite": addressFavorite,
                "id": member._id,
                "addressId": oldAddy._id
            }

            for (var add in memberDetails.contactDetails.addresses.choices) {
                var addyTitle = Object.keys(memberDetails.contactDetails.addresses.choices[add])[0]
                if (addyTitle === $item('#addressTitleInput').value) {
                    console.log('Address Name already saved')
                    return
                }
                if (memberDetails.contactDetails.addresses.choices[add][addyTitle].line1 === addressLine1 &&
                    memberDetails.contactDetails.addresses.choices[add][addyTitle].line2 === addressLine2 &&
                    memberDetails.contactDetails.addresses.choices[add][addyTitle].city === addressCity &&
                    memberDetails.contactDetails.addresses.choices[add][addyTitle].firstName === addressFirstName &&
                    memberDetails.contactDetails.addresses.choices[add][addyTitle].lastName === addressLastName &&
                    memberDetails.contactDetails.addresses.choices[add][addyTitle].state === addressState &&
                    memberDetails.contactDetails.addresses.choices[add][addyTitle].postal === addressPostalCode &&
                    memberDetails.contactDetails.addresses.choices[add][addyTitle].country === addressCountry &&
                    memberDetails.contactDetails.addresses.choices[add][addyTitle].phoneCountryCode === addressPhoneCountryCode &&
                    memberDetails.contactDetails.addresses.choices[add][addyTitle].phoneNumber === addressPhoneNumber &&
                    addyTitle === addressName) {
                    if (addressFavorite && memberDetails.contactDetails.addresses.favorite === addyTitle || !addressFavorite && memberDetails.contactDetails.addresses.favorite !== addyTitle) {
                        console.log('Address already saved')
                        return
                    }
                }

            }

            if (addressName !== oldAddy.name) {
                toUpdate.title = addressName
            }
            if (addressFirstName !== oldAddy.firstName) {
                toUpdate.firstName = addressFirstName
            }
            if (addressLastName !== oldAddy.lastName) {
                toUpdate.lastName = addressLastName
            }
            if (addressLine1 !== oldAddy.line1) {
                toUpdate.line1 = addressLine1
            }
            if (addressLine2 !== oldAddy.line1) {
                toUpdate.line2 = addressLine2
            }
            if (addressCity !== oldAddy.city) {
                toUpdate.city = addressCity
            }
            if (addressState !== oldAddy.state) {
                toUpdate.state = addressState
            }
            if (addressCountry !== oldAddy.country) {
                toUpdate.state = addressCountry
            }
            if (addressPostalCode !== oldAddy.postal) {
                toUpdate.state = addressPostalCode
            }
            if (addressPhoneCountryCode !== oldAddy.phoneCountryCode) {
                toUpdate.phoneCountryCode = addressPhoneCountryCode
            }
            if (addressPhoneNumber !== oldAddy.phoneNumber) {
                toUpdate.phoneNumber = addressPhoneNumber
            }

            if (!toUpdate.title &&
                !toUpdate.firstName &&
                !toUpdate.lastName &&
                !toUpdate.line1 &&
                !toUpdate.line2 &&
                !toUpdate.phoneCountryCode &&
                !toUpdate.phoneNumber &&
                !toUpdate.city &&
                !toUpdate.state &&
                !toUpdate.country &&
                !toUpdate.postal) {
                return
            } else {
                await updateMemberAddress(member._id, memberAddresses, toUpdate, memberDetails)
                    .then((res) => {
                        console.log(res)
                        console.log('Update Successful')
                        $w('#dynamicDataset').refresh()
                            .then(() => {
                                memberDetails = res
                                addressFavorite = undefined, addressName = undefined, addressFirstName = undefined, addressLastName = undefined, addressLine1 = undefined, addressLine2 = undefined, addressCity = undefined, addressPostalCode = undefined, addressCountry = undefined, addressState = undefined, addressPhoneCountryCode = undefined, addressPhoneNumber = undefined
                                // $w('#addressTitleInput').value = undefined
                                // $w('#addressFirstNameInput').value = undefined
                                // $w('#addressLastNameInput').value = undefined
                                // $w('#addressLine1Input').value = undefined
                                // $w('#addresssLine2Input').value = undefined
                                // $w('#addressCityInput').value = undefined
                                // $w('#addressStateDropdown').value = undefined
                                // $w('#addressPostalCodeInput').value = undefined
                                // $w('#addressPhoneNumberInput').value = undefined
                                // setAddressPhoneDropdown()
                                // setCountryDropdown()
                                $w('#favoriteAddresCheckbox').checked = false
                                $w('#addNewAddressBox').collapse()
                                $w('#savedAddressRepeater').expand()
                                $w('#storedAddressesBox').expand()
                                $w('#addressUpdatedSaved').expand()
                                $w('#addNewAddressButtonBox').expand()
                                $item('#editSavedAddressBox').collapse()
                                setAddressRepeater()
                                $w('#storedAddressesBox').scrollTo()
                            })
                    })
            }

        })
}

async function removeSavedAddress(addyiD) {
    await wixMembers.currentMember.getMember()
        .then(async (meme) => {
            console.log("meme", meme.contactDetails.addresses)
            memberAddresses = meme.contactDetails.addresses
            removeMemberAddress(addyiD, memberAddresses, member._id, memberDetails)
                .then((res) => {
                    console.log("res", res)
                    console.log('Removed Successfully')
                    $w('#dynamicDataset').refresh()
                        .then(() => {
                            memberDetails = res
                            //addressFavorite = undefined, addressName = undefined, addressFirstName = undefined, addressLastName = undefined, addressLine1 = undefined, addressLine2 = undefined, addressCity = undefined, addressPostalCode = undefined, addressCountry = undefined, addressState = undefined, addressPhoneCountryCode = undefined, addressPhoneNumber = undefined
                            $w('#deleteSavedAddressBox').collapse()
                            $w('#savedAddressRepeater').expand()
                            $w('#storedAddressesBox').expand()
                            $w('#addressUpdatedSaved').expand()
                            $w('#addNewAddressButtonBox').expand()
                            setAddressRepeater()
                            $w('#storedAddressesBox').scrollTo()
                        })
                })
        })
}

export function addressLine1Input_input(event) {
    $w('#addressLine1Error').collapse()
    autocomplete($w('#addressLine1Input').value, $w('#addressCountryDropdown').options[$w('#addressCountryDropdown').selectedIndex].value, "address")
        .then((res) => {
            //console.log(res)
            let predictions = res.predictions; // For simplicity we put the predictions in a new variable
            let suggestions = []; // We should create an empty array for the suggestions
            predictions.forEach(function (prediction) {
                let item = { "_id": getRandStr(), "address": prediction.description, "placeId": prediction.place_id };
                suggestions.push(item);
            });
            //console.log(res)
            $w("#addressRepeater").data = []; // clear the repeater contents
            $w("#addressRepeater").data = suggestions; // add the new suggestions to the repeater
            $w("#addressRepeater").expand(); // Repeater is full now, let's show it.

        })
}

function getRandStr(length = 10) {
    return Math.random().toString(20).substr(2, length)
}

export function addressRepeater_itemReady($item, itemData, index) {
    let fullAddy = itemData.address;
    $item("#addressRepeaterText").text = ""
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

            $item("#addressRepeaterText").text = fullAddy;

        })
    //console.log(itemData)

    $item("#addressRepeaterText").onClick((event) => {
        $w('#addressFirstNameErrorMessege').collapse()
        $w('#addressLastNameError').collapse()
        $w('#addressLine1Error').collapse()
        $w('#addressPostalCodeError').collapse()
        $w('#addressStateError').collapse()
        $w('#addressCityError').collapse()
        $w('#addressPhoneNumberError').collapse()
        $w('#addressLine1Input').value = undefined
        $w("#addressCityInput").value = undefined
        $w('#addressPostalCodeInput').value = undefined
        let addyarr = setAutocompleteSelection(fullAddy, $w('#addressCountryDropdown').options[$w('#addressCountryDropdown').selectedIndex].label)
        $w('#addressLine1Input').value = addyarr.line1;
        $w('#addresssLine2Input').value = addyarr.line2
        $w("#addressCityInput").value = addyarr.city;
        if (countriesWithStatesAndRegions.includes($w('#addressCountryDropdown').options[$w('#addressCountryDropdown').selectedIndex].value)) {
            autocompleteStateDropdown(addyarr.state)
        }
        $w('#addressPostalCodeInput').value = addyarr.postal
        $w('#addressRepeater').collapse()
    });
}

function autocompleteStateDropdown(autoState) {
    let arr = $w('#addressStateDropdown').options
    for (var key in arr) {
        if (arr[key].label === autoState || arr[key].value === autoState) {
            let sta = arr[key].label
            let index = parseInt(key)
            $w('#addressStateDropdown').selectedIndex = index
            break
        }
    }
}

export function addressCountryDropdown_change(event) {
    $w("#addressRepeater").collapse()
    $w('#addressCountryError').collapse()

    layoutBasedOffCoutntry($w('#addressCountryDropdown').value)
}

export function addressTitleInput_input(event) {
    $w('#addressTitleErrorMessege').collapse()
}

export function addressFirstNameInput_input(event) {
    $w('#piFirstNameError').collapse()
}

export function addressLastNameInput_input(event) {
    $w('#pILastNameError').collapse()
}

export function addressCityInput_input(event) {
    $w('#addressCityError').collapse()
}

export function addressPostalCodeInput_input(event) {
    $w('#addressPostalCodeError').collapse()
}

export function addressStateDropdown_change(event) {
    $w('#addressStateError').collapse()
}

export function addressPhoneCountryCodeDropdown_change(event) {
    $w('#addressPhoneCountryCodeError').collapse()
}

export function addressPhoneNumberInput_input(event) {
    $w('#addressPhoneNumberError').collapse()
}

async function setPaymentMethodRepeater() {
    $w('#savedPayMethodBox').expand()
    var methods = []
    $w('#savedPayMethodRepeater').data = []
    for (var index in memberDetails.paymentMethods) {
        await retrievePayMethod(memberDetails.paymentMethods[index], memberDetails.stripeId)
            .then((intent) => {
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
                    details: details
                }
                methods.push(item)
            })
    }
    $w('#savedPayMethodRepeater').data = []
    $w('#savedPayMethodRepeater').data = methods
}

export function savedPayMethodRepeater_itemReady($item, $itemData) {

    $item('#savedPaymentNameText').text = $itemData.type + " " + $itemData.number
    $item('#savedPaymentTypeText').text = $itemData.type
    if ($itemData.type === "Amex") {
        $item('#savedPaymentNumberText').text = "**** ****** *" + $itemData.number
    } else {
        $item('#savedPaymentNumberText').text = "**** **** **** " + $itemData.number
    }
    $item('#savedPaymentDetailsText').text = $itemData.details

    $item('#paymentNameBox').onClick(() => {
        if ($item('#viewSavedPayMethodBox').collapsed && $item('#deleteSavedPayMethodBox').collapsed) {
            $w('#savedPayMethodRepeater').forEachItem(($ite, $iteData, i) => {
                const arr = $ite('#viewSavedPayMethodBox')
                $ite('#payMethodShowHideText').text = "SHOW"
                arr.collapse()
                $ite('#deleteSavedPayMethodBox').collapse()
                $ite('#savedPaymentNameText').text = $iteData.type + " " + $iteData.number
            })
            $item('#viewSavedPayMethodBox').expand();
            $item('#payMethodShowHideText').text = "HIDE"
            //description.collapsed ? description.expand() : description.collapse();
        } else {
            $item('#payMethodShowHideText').text = "SHOW"
            $item('#viewSavedPayMethodBox').collapse()
            $item('#deleteSavedPayMethodBox').collapse()
            $item('#savedPaymentNameText').text = $itemData.type + " " + $itemData.number
        }
    })

    $item('#removeSavedCardButton').onClick(() => {
        $item('#deleteSavedPayMethodBox').expand()
        $item('#viewSavedPayMethodBox').collapse()
        $item('#savedPaymentNameText').text = "Confirm you want to remove " + $itemData.type + " " + $item('#savedPaymentNumberText').text + "?"
    })

    $item('#noDontRemoveSavedCard').onClick(() => {

    })

    $item('#yesRemoveSavedCard').onClick(() => {
        removePaymentMethod($itemData.method, $item, $itemData.setup)
    })
}

function handlePaymentChange() {
    $w('#saveCardButton').onClick(() => {
        if (!$w('#cardNumberInput').value) {
            $w('#cardNumberError').expand()
            $w('#cardNumberError').text = "INVALID CARD NUMBER"
        }
        if (!$w('#cardMonthExpiryInput').value || $w('#cardMonthExpiryInput').value.length != 2) {
            $w('#cardMonthError').expand()
            $w('#cardMonthError').text = "INVALID MONTH"
        }
        if (!$w('#cardYearExpiryInput').value || $w('#cardYearExpiryInput').value.length != 2) {
            $w('#cardYearError').expand()
            $w('#cardYearError').text = "INVALID YEAR"
        }
        if (!$w('#cardCVVCVCInput').value || $w('#cardCVVCVCInput').value.length != 3) {
            $w('#cardCvvCvcError').expand()
            $w('#cardCvvCvcError').text = "INVALID CVV/CVC"
        }
        if (!$w('#nameOnCardInput').value) {
            $w('#nameOnCardError').expand()
            $w('#nameOnCardError').text = "INVALID NAME"
        }
        if ($w('#cardNumberError').collapsed &&
            $w('#cardMonthError').collapsed &&
            $w('#cardYearError').collapsed &&
            $w('#cardCvvCvcError').collapsed &&
            $w('#nameOnCardError').collapsed) {
            proccessSavedCard()
        }
    })
}

function proccessSavedCard() {
    createToken(encodeCard(createCard()))
        .then((token) => {
            createPIntent(token, memberDetails.stripeId, memberDetails)
                .then((res) => {
                    memberDetails = res
                    clearCardFields()
                    $w('#addNewCardEditBox').collapse()
                    $w('#addNewCardButtonBox').expand()
                    setPaymentMethodRepeater()
                })
        })
}

function removePaymentMethod(id, $item, setup) {
    removePayMethod(id, memberDetails, setup)
        .then((res) => {
            memberDetails = res
            $item('#deleteSavedPayMethodBox').collapse()
            $w('#savedPayMethodBox').scrollTo()
            setPaymentMethodRepeater()
        })
        .catch((error) => {
            console.log(error)
        })
}

var cardKeyPress = ""

export function cardNumberInput_keyPress(event) {
    $w('#cardNumberError').collapse()
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
    $w('#cardNumberError').collapse()
    if (cType == 'Invalid') {
        // for Amex cards
        // block1 =  typeCheck;
        // block2='';
        // block3='';
        // block4='';
        $w('#cardNumberError').text = "INVALID CARD NUMBER"
        $w('#cardNumberError').expand()
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
    formatted = block1 + block2 + block3 + block4;
    $w('#cardNumberInput').value = formatted;
}

function createCard() {
    return {
        "name": $w("#nameOnCardInput").value,
        "number": $w("#cardNumberInput").value.replace(" ", ""),
        "cvc": $w("#cardCVVCVCInput").value,
        "exp_year": $w('#cardYearExpiryInput').value,
        "exp_month": $w('#cardMonthExpiryInput').value
    };
}

export function cardMonthExpiryInput_input(event) {
    $w('#cardMonthError').collapse()
}

export function cardYearExpiryInput_input(event) {
    $w('#cardYearError').collapse()
}

export function cardCVVCVCInput_input(event) {
    $w('#cardCvvCvcError').collapse()
}

export function nameOnCardInput_input(event) {
    $w('#nameOnCardError').collapse()
}

function clearCardFields() {
    $w('#cardTypeVector').src = 'wix:vector://v1/074041_320ce19f5f5a48628654db20a227260e.svg/iconmonstr-minus-2.svg'
    $w("#nameOnCardInput").value = undefined,
        $w("#cardNumberInput").value = undefined,
        $w("#cardCVVCVCInput").value = undefined,
        $w('#cardYearExpiryInput').value = undefined,
        $w('#cardMonthExpiryInput').value = undefined
}

export function dynamicDataset_ready() {
    member = $w('#dynamicDataset').getCurrentItem()
}

/**
*	Adds an event handler that runs when an input element's value
 is changed.
	[Read more](https://www.wix.com/corvid/reference/$w.ValueMixin.html#onChange)
*	 @param {Event} event
*/
export function editSavedAddressCountryDropDown_change(event) {
    $w('#editSavedAddressCountryErrorText').collapse()
    layoutEditBasedOffCoutntry($w('#editSavedAddressCountryDropDown').value)
}

function layoutBasedOffCoutntry(countryC) {
    setStateDropdown(countryC)
    if (countryC === "US") {
        $w('#addresssLine2Box').expand()
        $w('#addressCityTextLabel').text = "CITY*"
        $w('#addressPostalCodeTextLabel').text = "POSTAL CODE*"
    }
    if (countryC === "IN") {
        $w('#addresssLine2Box').collapse()
        $w('#addressCityTextLabel').text = "AREA, COLONY, STREET, SECTOR, VILLAGE/TOWN/CITY*"
        $w('#addressPostalCodeTextLabel').text = "PINCODE*"
    }
}

function layoutEditBasedOffCoutntry(countryC, state, item) {
    setStateEditDropdown(countryC, state, item)
    if (countryC === "US") {
        item('#editSavedAddressLine2Box').expand()
        item('#editAddressCityTextLabel').text = "CITY*"
        item('#editAddressPostalCodeTextLabel').text = "POSTAL CODE*"
    }
    if (countryC === "IN") {
        item('#editSavedAddressLine2Box').collapse()
        item('#editAddressCityTextLabel').text = "AREA, COLONY, STREET, SECTOR, VILLAGE/TOWN/CITY*"
        item('#editAddressPostalCodeTextLabel').text = "PINCODE*"
    }
}

function setStateDropdown(countryC) {
    if (countryC === "US") {
        const states = usStates.map((item, index) => {
            return {
                label: item.name,
                value: item.abbreviation
            }
        })
        $w('#addressStateDropdown').options = states
    } else if (countryC === "IN") {
        const states = indiaStates.map((item, index) => {
            return {
                label: item.name,
                value: item.abbreviation
            }
        })
        $w('#addressStateDropdown').options = states
    }
    // else if (shippingCountry[0] === "BR") {
    //     const states = brazilStates.map((item, index) => {
    //         return {
    //             label: item.name,
    //             value: item.abbreviation
    //         }
    //     })
    //     $w('#addressStateDropdown').options = states
    // } else if (userCountry[0] === "CA") {
    //     const states = canadaStates.map((item, index) => {
    //         return {
    //             label: item.name,
    //             value: item.abbreviation
    //         }
    //     })
    //     $w('#addressStateDropdown').options = states
    // }

}

function setStateEditDropdown( countryC, selectedState, item) {
    var states
    if (countryC === "US") {
        states = usStates.map((item, index) => {
            return {
                label: item.name,
                value: item.abbreviation
            }
        })
        item('#editSavedAddressStateDropdown').options = states
    } else if (countryC === "IN") {
        states = indiaStates.map((item, index) => {
            return {
                label: item.name,
                value: item.abbreviation
            }
        })
        item('#editSavedAddressStateDropdown').options = states
    }
    // else if (shippingCountry[0] === "BR") {
    //     const states = brazilStates.map((item, index) => {
    //         return {
    //             label: item.name,
    //             value: item.abbreviation
    //         }
    //     })
    //     $w('#addressStateDropdown').options = states
    // } else if (userCountry[0] === "CA") {
    //     const states = canadaStates.map((item, index) => {
    //         return {
    //             label: item.name,
    //             value: item.abbreviation
    //         }
    //     })
    //     $w('#addressStateDropdown').options = states
    // }

    for (var state in states) {
        if (states[state].value === selectedState) {
            let index = parseInt(state)
            item('#editSavedAddressStateDropdown').selectedIndex = index
            break
        }
    }

}
import wixMembers from 'wix-members';
import { local } from 'wix-storage'
import wixData from 'wix-data';
import wixWindow from 'wix-window';

import { countryListAlpha2 } from 'public/shippingBack'
import { encryptPass, pWComp, storeNewAuth, updateInterestAndPrivacy, updateMarketingPreferences, updateCountryLanguagePreferences, changeFirebaseAuth } from 'backend/account.jsw'

var member, memberDetails
var passwordRegex = /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$ %^&*-]).{8,}$/

$w.onReady(function () {
    setOnClicks()
    setPage()
});

function setOnClicks() {
    $w('#changePasswordButton').onClick(() => {
        $w("#passwordChangeSavedText").collapse()
        $w('#changePasswordButtonBox').collapsed ? $w('#changePasswordButtonBox').expand() : $w('#changePasswordButtonBox').collapse()
        $w('#changePasswordEditBox').collapsed ? $w('#changePasswordEditBox').expand() : $w('#changePasswordEditBox').collapse()
    })
    $w('#cancelChangePasswordButton').onClick(() => {
        $w('#box88').scrollTo()
        $w('#changePasswordButtonBox').collapsed ? $w('#changePasswordButtonBox').expand() : $w('#changePasswordButtonBox').collapse()
        $w('#changePasswordEditBox').collapsed ? $w('#changePasswordEditBox').expand() : $w('#changePasswordEditBox').collapse()
    })

    $w('#currentPasswordShow').onClick(() => {
        $w('#currentPasswordInput').focus()
        if ($w('#currentPasswordShow').label === "SHOW") {
            $w('#currentPasswordShow').label = "HIDE"
            $w('#currentPasswordInput').inputType = "text";
        } else {
            $w('#currentPasswordShow').label = "SHOW"
            $w('#currentPasswordInput').inputType = "password";
        }
    })

    $w('#newPasswordShow').onClick(() => {
        $w('#currentPasswordInput').focus()
        if ($w('#newPasswordShow').label === "SHOW") {
            $w('#newPasswordShow').label = "HIDE"
            $w('#newPasswordInput').inputType = "text";
        } else {
            $w('#newPasswordShow').label = "SHOW"
            $w('#newPasswordInput').inputType = "password";
        }
    })
}

function setPage() {
    member = $w('#dynamicDataset').getCurrentItem()
    console.log("mem", member)
    wixData.get("Members", member._id)
        .then((mem) => {
            memberDetails = mem
            console.log("mem dets", memberDetails)
            setInterestPrivacy()
            setMarketingPreferences()
            setCountryLanguage()
            handlePassword()
            handleInterestAndPrivacy()
            handleMarketingPreferences()
            handleCountryLanguagePreferences()
        })
}

function setInterestPrivacy() {
    if (memberDetails.preferences.marketingConsent) {
        $w('#marketingConsentCheckbox').checked = true
    }
    if (memberDetails.preferences.dataProfiling) {
        $w('#profilingCheckbox').checked = true
    }
    if (memberDetails.preferences.interest.menswear) {
        $w('#collectionCheckboxes').selectedIndices = [1]
    }
    if (memberDetails.preferences.interest.womenswear) {
        $w('#collectionCheckboxes').selectedIndices = [0]
    }
    if (memberDetails.preferences.interest.womenswear && memberDetails.preferences.interest.menswear) {
        $w('#collectionCheckboxes').selectedIndices = [0, 1]
    }
}

function setMarketingPreferences() {
    var choiceArr = []
    if (memberDetails.preferences.marketing.smsMms) {
        choiceArr.push(1)
    }
    if (memberDetails.preferences.marketing.newsletterEmail) {
        choiceArr.push(0)
    }
    if (memberDetails.preferences.marketing.mail) {
        choiceArr.push(2)
    }
    $w('#marketingChoicesCheckboxGroup2').selectedIndices = choiceArr
}

function setCountryLanguage() {
    countryListAlpha2.sort((a, b) => a.countryName.toLowerCase() > b.countryName.toLowerCase() ? 1 : -1);
    let arr = countryListAlpha2.map((item, index) => {
        return {
            label: item.countryName,
            value: item.countryCode
        }
    })
    $w('#countryDropdown').options = arr

    var perferedCountry = memberDetails.preferences.countryPreference.split("~")
    for (var country in arr) {
        if (perferedCountry[1] === arr[country].label) {
            let index = parseInt(country)
            $w('#countryDropdown').selectedIndex = index
            break
        }
    }

    var lingual = wixWindow.multilingual.siteLanguages
    lingual.sort((a, b) => a.name.toLowerCase() > b.name.toLowerCase() ? 1 : -1);
    let languages = lingual.map((obj) => {
        return {
            label: obj.name,
            value: obj.languageCode
        };
    });
    $w('#languagesDropDown').options = languages;

    var perferedLanguage = memberDetails.preferences.languagePreference.split("~")

    console.log(perferedLanguage)
    for (var lang in languages) {
        console.log(languages[lang].value)
        if (perferedLanguage[0] === languages[lang].value) {
            let index = parseInt(lang)
            $w('#languagesDropDown').selectedIndex = index
            break
        }
    }
}

function handlePassword() {
    $w('#savePasswordChangeButton').onClick(() => {
        if (!$w('#newPasswordInput').value) {
            $w('#newPasswordError').expand()
            $w('#newPasswordError').text = "PLEASE ENTER A VALID PASSWORD"
        }
        if (!$w('#currentPasswordInput').value) {
            $w('#currentPasswordError').expand()
            $w('#currentPasswordError').text = "CURRENT PASSWORD REQUIRED"
        }
        if ($w('#currentPasswordError').collapsed && $w('#newPasswordError').collapsed) {
            pWComp($w('#currentPasswordInput').value, memberDetails.auth)
                .then((res) => {
                    if (res) {
                        if ($w('#currentPasswordInput').value === $w('#newPasswordInput').value) {
                            console.log("passwords can not match")
                            return
                        } else {
                            changeFirebaseAuth($w('#newPasswordInput').value)
                                .then((res) => {
                                    if (res) {
                                        encryptAndStorePassword($w('#newPasswordInput').value)
                                    } else {
                                        console.log("FB ERROR")
                                    }
                                })
                                .catch((error) => {
                                    console.log(error)
                                })
                        }
                    } else {
                        console.log("Invalid current Password")
                        return
                    }
                })
                .catch((error) => {
                    console.log(error)
                })
        } else {
            console.log("errors present")
            return
        }
    })
}

function encryptAndStorePassword(auth) {
    encryptPass(auth)
        .then((res) => {
            if (res.status === 200) {
                var newAuth = res.messege
                storeNewAuth(newAuth, memberDetails)
                    .then((mem) => {
                        memberDetails = mem
                        $w('#newPasswordInput').value = undefined
                        $w('#currentPasswordInput').value = undefined
                        $w("#changePasswordEditBox").collapse()
                        $w("#changePasswordButtonBox").expand()
                        $w("#passwordChangeSavedText").expand()
                        $w('#box88').scrollTo()
                    })
            } else {
                console.log(res.messege)
                return
            }
        })
        .catch((error) => {
            console.log(error)
            return
        })
}

export function newPasswordInput_input(event) {
    $w('#newPasswordError').collapse()
    if (!$w('#newPasswordInput').value.match(passwordRegex)) {
        $w('#newPasswordError').expand()
        $w('#newPasswordError').text = "PLEASE ENTER A VALID PASSWORD"
    }
}

export function currentPasswordInput_input(event) {
    $w('#currentPasswordError').collapse()
}

function handleInterestAndPrivacy() {
    $w('#saveCheckboxesEditButton').onClick(() => {
        var newPreferences = {
            marketing: $w('#marketingConsentCheckbox').checked,
            profiling: $w('#profilingCheckbox').checked,
            menswear: false,
            womenswear: false
        }
        if ($w('#collectionCheckboxes').selectedIndices.includes(1)) {
            newPreferences.menswear = true
        }
        if ($w('#collectionCheckboxes').selectedIndices.includes(0)) {
            newPreferences.womenswear = true
        }
        updateInterestAndPrivacy(newPreferences, memberDetails)
            .then((res) => {
                memberDetails = res
                //console.log(res)
                $w('#saveCheckboxesEditButton').collapse()
                setInterestPrivacy()
                $w('#interestAndPrivacyChangesSavedText').expand()
                $w('#box101').scrollTo()
            })
    })

}

function handleMarketingPreferences() {
    $w('#saveMArketingPreverencesButton').onClick(() => {
        var newPreferences = {
            smsMms: false,
            newsletterEmail: false,
            mail: false
        }
        if ($w('#marketingChoicesCheckboxGroup2').selectedIndices.includes(1)) {
            newPreferences.smsMms = true
        }
        if ($w('#marketingChoicesCheckboxGroup2').selectedIndices.includes(0)) {
            newPreferences.newsletterEmail = true
        }
        if ($w('#marketingChoicesCheckboxGroup2').selectedIndices.includes(2)) {
            newPreferences.mail = true
        }
        updateMarketingPreferences(newPreferences, memberDetails)
            .then((res) => {
                memberDetails = res
                //console.log(res)
                $w('#saveMArketingPreverencesButton').collapse()
                setMarketingPreferences()
                $w('#marketingPreferenceChangesSavedText').expand()
                $w('#box104').scrollTo()
            })
    })
}

export function marketingChoicesCheckboxGroup2_change(event) {
    $w('#marketingPreferenceChangesSavedText').collapse()
    if (memberDetails.preferences.marketing.smsMms && $w('#marketingChoicesCheckboxGroup2').selectedIndices.includes(1) || !memberDetails.preferences.marketing.smsMms && !$w('#marketingChoicesCheckboxGroup2').selectedIndices.includes(1)) {
        if (memberDetails.preferences.marketing.newsletterEmail && $w('#marketingChoicesCheckboxGroup2').selectedIndices.includes(0) || !memberDetails.preferences.marketing.newsletterEmail && !$w('#marketingChoicesCheckboxGroup2').selectedIndices.includes(0)) {
            if (memberDetails.preferences.marketing.mail && $w('#marketingChoicesCheckboxGroup2').selectedIndices.includes(2) || !memberDetails.preferences.marketing.mail && !$w('#marketingChoicesCheckboxGroup2').selectedIndices.includes(2)) {
                $w('#saveMArketingPreverencesButton').collapse()
            } else {
                $w('#saveMArketingPreverencesButton').expand()
            }
        } else {
            $w('#saveMArketingPreverencesButton').expand()
        }
    } else {
        $w('#saveMArketingPreverencesButton').expand()
    }
}

export function profilingCheckbox_change(event) {
    $w('#interestAndPrivacyChangesSavedText').collapse()
    if (memberDetails.preferences.marketingConsent && $w('#marketingConsentCheckbox').checked || !memberDetails.preferences.marketingConsent && !$w('#marketingConsentCheckbox').checked) {
        if (memberDetails.preferences.dataProfiling && $w('#profilingCheckbox').checked || !memberDetails.preferences.dataProfiling && !$w('#profilingCheckbox').checked) {
            if (memberDetails.preferences.interest.womenswear && $w('#collectionCheckboxes').selectedIndices.includes(0) || !memberDetails.preferences.interest.womenswear && !$w('#collectionCheckboxes').selectedIndices.includes(0)) {
                if (memberDetails.preferences.interest.menswear && $w('#collectionCheckboxes').selectedIndices.includes(1) || !memberDetails.preferences.interest.menswear && !$w('#collectionCheckboxes').selectedIndices.includes(1)) {
                    $w('#saveCheckboxesEditButton').collapse()
                } else {
                    $w('#saveCheckboxesEditButton').expand()
                }
            } else {
                $w('#saveCheckboxesEditButton').expand()
            }
        } else {
            $w('#saveCheckboxesEditButton').expand()
        }
    } else {
        $w('#saveCheckboxesEditButton').expand()
    }

}

export function marketingConsentCheckbox_change(event) {
    $w('#interestAndPrivacyChangesSavedText').collapse()
    if (memberDetails.preferences.marketingConsent && $w('#marketingConsentCheckbox').checked || !memberDetails.preferences.marketingConsent && !$w('#marketingConsentCheckbox').checked) {
        if (memberDetails.preferences.dataProfiling && $w('#profilingCheckbox').checked || !memberDetails.preferences.dataProfiling && !$w('#profilingCheckbox').checked) {
            if (memberDetails.preferences.interest.womenswear && $w('#collectionCheckboxes').selectedIndices.includes(0) || !memberDetails.preferences.interest.womenswear && !$w('#collectionCheckboxes').selectedIndices.includes(0)) {
                if (memberDetails.preferences.interest.menswear && $w('#collectionCheckboxes').selectedIndices.includes(1) || !memberDetails.preferences.interest.menswear && !$w('#collectionCheckboxes').selectedIndices.includes(1)) {
                    $w('#saveCheckboxesEditButton').collapse()
                } else {
                    $w('#saveCheckboxesEditButton').expand()
                }
            } else {
                $w('#saveCheckboxesEditButton').expand()
            }
        } else {
            $w('#saveCheckboxesEditButton').expand()
        }
    } else {
        $w('#saveCheckboxesEditButton').expand()
    }
}

export function collectionCheckboxes_change(event) {
    $w('#interestAndPrivacyChangesSavedText').collapse()
    if (memberDetails.preferences.marketingConsent && $w('#marketingConsentCheckbox').checked || !memberDetails.preferences.marketingConsent && !$w('#marketingConsentCheckbox').checked) {
        if (memberDetails.preferences.dataProfiling && $w('#profilingCheckbox').checked || !memberDetails.preferences.dataProfiling && !$w('#profilingCheckbox').checked) {
            if (memberDetails.preferences.interest.womenswear && $w('#collectionCheckboxes').selectedIndices.includes(0) || !memberDetails.preferences.interest.womenswear && !$w('#collectionCheckboxes').selectedIndices.includes(0)) {
                if (memberDetails.preferences.interest.menswear && $w('#collectionCheckboxes').selectedIndices.includes(1) || !memberDetails.preferences.interest.menswear && !$w('#collectionCheckboxes').selectedIndices.includes(1)) {
                    $w('#saveCheckboxesEditButton').collapse()
                } else {
                    $w('#saveCheckboxesEditButton').expand()
                }
            } else {
                $w('#saveCheckboxesEditButton').expand()
            }
        } else {
            $w('#saveCheckboxesEditButton').expand()
        }
    } else {
        $w('#saveCheckboxesEditButton').expand()
    }
}

function handleCountryLanguagePreferences() {
    $w('#saveCountryLanguageChangeButton').onClick(() => {

        let count = countryListAlpha2.filter(couuntr => {
            return couuntr.countryCode === $w('#countryDropdown').value
        });
        let country = (count[0].countryCode + "~" + count[0].countryName + "~" + count[0].language + "~" + count[0].currency + "~" + count[0].locale)
        var newPreferences = {
            country: country,
            language: $w('#languagesDropDown').value + "~" + $w('#languagesDropDown').value + "-" + $w('#countryDropdown').value.toLowerCase()
        }
        updateCountryLanguagePreferences(newPreferences, memberDetails)
            .then((res) => {
                memberDetails = res
                //console.log(res)
                $w('#saveCountryLanguageChangeButton').collapse()
                setCountryLanguage()
                $w('#countryAndLanguageChangeSavedText').expand()
                $w('#box102').scrollTo()
            })
    })
}

export function countryDropdown_change(event) {
    $w('#countryAndLanguageChangeSavedText').collapse()
    var perferedCountry = memberDetails.preferences.countryPreference.split("~")
    var perferedLang = memberDetails.preferences.languagePreference.split("~")
    if (perferedLang[0] === $w('#languagesDropDown').value && perferedCountry[0] === $w('#countryDropdown').value) {
        $w('#saveCountryLanguageChangeButton').collapse()
    } else {
        $w('#saveCountryLanguageChangeButton').expand()
    }
}

export function languagesDropDown_change(event) {
    $w('#countryAndLanguageChangeSavedText').collapse()
    var perferedCountry = memberDetails.preferences.countryPreference.split("~")
    var perferedLang = memberDetails.preferences.languagePreference.split("~")
    if (perferedLang[0] === $w('#languagesDropDown').value && perferedCountry[0] === $w('#countryDropdown').value) {
        $w('#saveCountryLanguageChangeButton').collapse()
    } else {
        $w('#saveCountryLanguageChangeButton').expand()
    }
}
import wixLocation from 'wix-location';
import wixMembers from 'wix-members'
import wixUsers from 'wix-users';
import { session } from 'wix-storage';
import wixFetch from 'wix-fetch';
import { getUserLogin } from 'backend/account'

import { app } from "public/firebaseConfig";
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth'

var member
var login = false

wixMembers.currentMember.getMember()
    .then((mem) => {
        if (mem) {
            member = mem
            wixLocation.to('/account')
        }
    })

var validRegex = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/

$w.onReady(function () {
    setEmailInput()
    setPassword()
    setUpMemberLogin()
});

function setEmailInput() {
    $w('#emailInput').onInput(() => {
        validateEmailInput($w('#emailInput').value, $w('#emailErrorText'), $w('#emailCheck'), $w('#memberLoginButton'))
    })
}

function validateEmailInput(input, error, check, button) {
    if (!input.match(validRegex)) {
        error.expand()
        check.collapse()
        error.text = "PLEASE ENTER A VALID EMAIL"

    } else {
        check.expand()
        error.collapse()
    }
}

function setPassword() {
    $w('#memberPasswordShow').onClick(() => {
        $w('#passwordInput').focus()
        if ($w('#memberPasswordShow').label === "SHOW") {
            $w('#memberPasswordShow').label = "HIDE"
            $w('#passwordInput').inputType = "text";
        } else {
            $w('#memberPasswordShow').label = "SHOW"
            $w('#passwordInput').inputType = "password";
        }
    })
}

function setUpMemberLogin() {
    accountIconSetUo()
    $w('#memberLoginButton').onClick(async () => {
        const email = $w('#emailInput').value;
        const password = $w('#passwordInput').value;

        firebaseLogin(email, password)
            .then(async (res) => {
                console.log(res)
                if (res) {
                    getUserLogin(email)
                        .then(async (loginResult) => {
                            if (loginResult.approved) {
                                await wixMembers.authentication.applySessionToken(loginResult.sessionToken)
                                    .then(() => {
                                        accountIconSetUo()
                                        wixLocation.to('/account')
                                    })
                            } else {
                                console.log("Member not approved.", loginResult);
                            }
                        })
                        .catch((error) => {
                            Error(error)
                        })
                } else {
                    console.log(res)
                }
            })
            .catch ((error) => {
                console.log("firebase login error ", error)
            })

    });
}

function firebaseLogin(email, password) {
    const auth = getAuth();
    return signInWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            return userCredential.user;
        })
        .catch((error) => {
            const errorCode = error.code;
            const errorMessage = error.message;
            return error
        });
}

function accountIconSetUo() {
    wixMembers.currentMember.getMember()
        .then((member) => {
            if (member) {
                setAccountHover(member.contactDetails.firstName + " " + member.contactDetails.lastName)
            } else {
                setUpGuestFunctions()
            }
        })
}

function setAccountHover(member) {
    $w('#accountHoverName').text = member
    $w('#accountIconBox').onClick(() => {
        wixLocation.to('/account')
    })

    $w('#accountIconBox').onMouseIn(() => {
        $w('#accountHoverMenu').show()
    })

    $w('#accountHoverMenu').onMouseOut((event) => {
        let offsetY = event.offsetY;
        let offsetX = event.offsetX;
        if (!(offsetY < 3 && (offsetX > 160 && offsetX < 186) && offsetY > -22)) {
            $w('#accountHoverMenu').hide()
        } else {
            $w('#accountHoverMenu').show()
        }
    })
    $w('#accountIconBox').onMouseOut((event) => {
        let offsetY = event.offsetY;
        let offsetX = event.offsetX;
        if ((offsetX < 0 && !(offsetY > 22)) || (offsetX > 22 && !(offsetY > 22)) || offsetY < 0) {
            $w('#accountHoverMenu').hide()
        } else {
            $w('#accountHoverMenu').show()
        }
    })
    if (login) {
        wixLocation.to('/account')
    }
}

function setUpGuestFunctions() {
    $w('#accountIconBox').onClick(() => {
        wixLocation.to('/login-and-registration')
    })
}
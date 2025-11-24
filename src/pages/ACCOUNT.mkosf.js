import wixLocation from 'wix-location';
import wixMembers from 'wix-members';
import wixUsers from 'wix-users';
import { applyToken } from '@velo/google-sso-integration';
var member
var google

$w.onReady(function () {
    accountIconSetUo()
});

function accountIconSetUo() {
        member = $w('#dynamicDataset').getCurrentItem()
        console.log(member)
        setAccountHover()

}

function setAccountHover() {
    console.log('in')
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
}
import wixLocation from 'wix-location';
import wixWindow from 'wix-window';

const languages = wixWindow.multilingual.siteLanguages

$w.onReady(function () {
    let received = wixWindow.lightbox.getContext();
    const arr = received.s1.map(item => {
        return {
            _id: item,
            name: item
        }
    })
    $w('#languageRepeater').data = arr
});

export function closeButton_click(event) {
    wixWindow.lightbox.close();
}

export function languageRepeater_itemReady($item, $itemData, index) {
    for (var i in languages) {
        if (languages[i].languageCode === $itemData.name) {
            $item('#languageButton').label = languages[i].name.toUpperCase()
            break
        }
    }

    $item('#languageButton').onClick(() => {
        console.log(index)
        wixWindow.lightbox.close({
            "s1": index
        });
    })
}
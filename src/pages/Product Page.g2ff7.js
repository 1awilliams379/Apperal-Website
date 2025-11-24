// API Reference: https://www.wix.com/velo/reference/api-overview/introduction
// “Hello, World!” Example: https://learn-code.wix.com/en/article/1-hello-world
import wixAnimations from 'wix-animations';
import wixWindow from 'wix-window';
import wixStores from 'wix-stores';
import wixPay from 'wix-pay';
import { local } from 'wix-storage';

const selectedColor = '#FFFFFF'
const defaultColor = '#979797'
let productOptions = {};
let quantity = 1;
let selectedSize = "";
let selSizeGood = false;

let userCountry = local.getItem("userCountry");
let userLanguage = local.getItem("userLanguage");
let currentCurrency, locale, currencyCode;

$w.onReady(function () {
    return getProductDetails();
});

async function getProductDetails() {
    $w('#productPage1').getProduct()
        .then((productInfo) => {
            console.log(productInfo)
            let split = userCountry.split('~')
            let lsplit = userLanguage.split('~')
            locale = lsplit[1]
            currencyCode = split[3]

            let dollarUS = Intl.NumberFormat(locale, {
                //localeMatcher: "best fit"
                style: "currency",
                currency: currencyCode,
            });
            currentCurrency = dollarUS
            setProductTextInfo(productInfo);
            updateProductQuantity(productInfo.quantityInStock);
            setAdditionalInfo(productInfo.additionalInfoSections);
            updateProductImages(productInfo.mediaItems);

            if (wixWindow.formFactor === "Mobile") {
                updateProductOptionsMobile(productInfo.productOptions);
                setupMobile(productInfo);
            } else {
                updateProductOptions(productInfo.productOptions);
                desktopAddCart(productInfo)
            }

        })
        .catch((error) => {
            console.error(error);
        });
}

function setupMobile(productInfo) {
    $w('#addToCart').disable()
    $w('#addToCart').collapse()
    $w('#productPrise').collapse()
    $w('#sizesDropdown').disable()
    $w('#sizesBox').collapse()
    $w('#productNameMobile').text = productInfo.name;
    $w('#selectedSizeText').text = selectedSize

    wixPay.currencies.currencyConverter.convertAmounts({
            "amounts": [productInfo.price],
            "from": "USD",
            "to": currencyCode
        })
        .then((amounts) => {
            $w('#productPriseMobile').text = currentCurrency.format(amounts.amounts[0])
        })

    $w('#closeProductOptionsMobile').onClick(() => {
        $w('#productOptionsBox').collapse()
    })

    $w('#selectedSizeBox').onClick(() => {
        $w('#productOptionsBox').expand()
    })

    $w('#addToCartMobile').onClick(async () => {
        await validateProductOptionsMobile().then((x) => {
            if (x) {
                wixStores.cart.addProducts([{
                        "productId": productInfo._id,
                        "quantity": quantity,
                        "options": {
                            "choices": productOptions
                        }
                    }])
                    .then(() => {
                        console.log("product added");
                    })
                    .catch((error) => {
                        console.log(error);
                    });
            }
        })
    })

}

function desktopAddCart(productInfo) {
    $w('#addToCartMobile').disable()
    $w('#addToCartMobile').collapse()
    $w('#productPriseMobile').collapse()
    $w('#mobileBottomBox').collapse()

    $w('#addToCart').onClick(async () => {
        await validateProductOptions()
            .then((x) => {
                if (x) {
                    // $w('#shoppingCartIcon1').addToCart(productInfo._id, quantity, {
                    // 	"choices": productOptions
                    // })
                    wixStores.cart.addProducts([{
                            "productId": productInfo._id,
                            "quantity": quantity,
                            "options": {
                                "choices": productOptions
                            }
                        }])
                        .then(() => {
                            console.log("product added");
                        })
                        .catch((error) => {
                            console.log(error);
                        });
                }
            })
    })

}

function setProductTextInfo(productInfo) {
    $w('#ribbon').text = productInfo.ribbon;
    $w('#productName').text = productInfo.name;
    $w('#productDescription').html = productInfo.description;
    $w('#currencyText').text = "CURRENCY: " + currencyCode

    console.log(productInfo.price, currencyCode)
    wixPay.currencies.currencyConverter.convertAmounts({
            "amounts": [productInfo.price],
            "from": "USD",
            "to": currencyCode
        })
        .then((amounts) => {
            $w('#productPrise').text = currentCurrency.format(amounts.amounts[0])
        })
}

function updateProductOptionsMobile(options) {

    var finalSizes = [];
    const setSizes = options.Size.choices.map((item, index) => {
        //console.log(item.inStock);
        if (item.inStock === true) {
            return {
                _id: index.toString(),
                label: item.description,
                value: item.value,
                stock: item.inStock
            }
        } else {
            return {
                _id: index.toString(),
                label: `${item.description} (OUT OF STOCK)`,
                value: `${item.value}`,
                stock: item.inStock
            }
        }
    })

    $w('#sizesRepeater').data = setSizes;
}

export function sizesRepeater_itemReady($item, itemData, index) {
    const box = $item('#sizesBoxReapeat');
    const labelText = $item("#sizesBoxText");

    if (itemData.label.includes("OUT OF STOCK")) {
        labelText.text = itemData.value;
        labelText.html = `<span style="text-decoration: line-through; color: #979797; font-size: 16px; font-weight: bold; font-face: Kiona, Regular">${labelText.text}</span>`
    } else {
        labelText.text = itemData.label;
        labelText.html = `<span style="text-decoration: none; color: #FFFFFF; font-size: 16px; font-weight: bold; font-family: https://static.wixstatic.com/ufonts/274ffa_aa271e9f45964425b50c08fe4d2d84a0/woff2/file.woff2">${labelText.text}</span>`
    }

    box.onClick(() => {
        if (!itemData.label.includes("OUT OF STOCK")) {
            productOptions.Size = labelText.text
            validateProductOptionsMobile()
        }
    })
}

function updateProductOptions(options) {

    var finalSizes = [];
    const setSizes = options.Size.choices.map(item => {
        //console.log(item.inStock);
        if (item.inStock === true) {
            return {
                label: item.description,
                value: item.value,
                stock: item.inStock
            }
        } else {
            return {
                label: `${item.description} (OUT OF STOCK)`,
                value: `${item.value} (OUT OF STOCK)`,
                stock: item.inStock
            }
        }
    })
    //console.log(setSizes)
    //console.log(setSizes.array.stock)

    $w('#sizesDropdown').options = setSizes;
}

function updateProductQuantity(quan) {
    if (quan === 0) {
        $w('#sizesDropdown').disable();
        $w('#sizesDropdown').placeholder = "OUT OF STOCK";
        $w('#addToCart').disable();
        $w('#addToCart').label = 'OUT OF STOCK'
    }
}

function setAdditionalInfo(additionalInfo) {
    const newAdditionalInfo = additionalInfo.map((item, index) => {
        return {
            _id: index.toString(),
            title: item.title,
            description: item.description,
        }

    })
    $w('#additionalInfoSectionsRepeater').data = newAdditionalInfo;
}

export function additionalInfoSectionsRepeater_itemReady($item, itemData, index) {
    const button = $item('#additionalInfoButton');
    const description = $item('#additionalInfoDescription');
    const vector = $item('#additionalInfoVector')
    button.label = itemData.title;
    description.html = itemData.description;

    button.onClick(() => {
        if (description.collapsed) {
            $w('#additionalInfoSectionsRepeater').forEachItem(($item, itemData, i) => {
                const arr = $item('#additionalInfoDescription');
                arr.collapse()
            })
            description.expand();
            //description.collapsed ? description.expand() : description.collapse();
        } else {
            description.collapse()
        }

    })
}

function updateProductImages(images) {
    const newImagesArray = images.map((item, index) => {
        return {
            _id: index.toString(),
            image: item.src,
            thumbnail: item.thumbnail || '',
            type: item.type
        };
    });

    $w('#productImagesRepeater').data = [];
    $w('#productImagesRepeater').data = newImagesArray;
    $w('#anchorRepeater').data = [];
    $w('#anchorRepeater').data = newImagesArray;

    const mainImage = newImagesArray[0];
    mainImage.type === 'Video' ? updateMainImage(mainImage.image, 'Video') : updateMainImage(mainImage.image, 'Image');

}

export function productImagesRepeater_itemReady($item, itemData, index) {
    if (index == 0) {
        updateSelectedAnchorItem(index)
    }

    $item('#imageNumber').text = index + 1 < 10 ? `0${index + 1}` : `0${index + 1}`;
    if (itemData.type === 'Video') {
        const videoThumbnail = itemData.thumbnail.replace('orginWidth=50&orginHeight=50', 'orginWidth=500&orginHeight=500');
        $item('#collectionImage').src = videoThumbnail;
    } else {
        $item('#collectionImage').src = itemData.image;
    }

    $item('#collectionImage').onClick(() => {
        if (itemData.type === 'Image') {
            updateMainImage(itemData.image, 'Image');
        } else {
            updateMainImage(itemData.image, 'Video');
        }
        updateSelectedAnchorItem(index)
    });

    $item('#box11').onMouseIn(() => {
        wixAnimations.timeline().add($item('#collectionImage'), { scale: 1.05, duration: 200 }).play();
    })

    $item('#box11').onMouseOut(() => {
        wixAnimations.timeline().add($item('#collectionImage'), { scale: 1, duration: 200 }).play();
    })
}

function updateSelectedAnchorItem(index) {

    $w('#productImagesRepeater').forEachItem(($item, itemData, i) => {
        if (index === i) {
            $item('#imageNumber').html = `<p style="color:${selectedColor}">${$item('#imageNumber').text}</p>`;
            //$item('#collectionImage').scrollTo();
            //$item('#anchorButton').label = $item('#imageNumber').html
        } else {
            $item('#imageNumber').html = `<p style="color:${defaultColor}">${$item('#imageNumber').text}</p>`;
        }
    })

    $w('#anchorRepeater').forEachItem(($item, itemData, i) => {
        if (index === i) {
            $item('#anchorButton').style.color = selectedColor;
        } else {
            $item('#anchorButton').style.color = '#979797';
        }
    })
}

function updateMainImage(media, type) {
    if (type === 'Video') {
        $w('#mainVideo').expand();
        $w('#mainVideo').src = media;
        $w('#mainImageBox').collapse();
    } else {
        $w('#mainImageBox').expand();
        $w('#mainImage').src = media;
        $w('#mainVideo').collapse();
    }
}

export function anchorRepeater_itemReady($item, itemData, index) {
    $item('#anchorButton').label = index + 1 < 10 ? `0${index + 1}` : `${index + 1}`;

    $item('#anchorButton').onClick(() => {
        const contentToDisplay = $w('#productImagesRepeater').data[index];

        if (contentToDisplay.type === 'Image') {
            updateMainImage(contentToDisplay.image, 'Image');
        } else {
            updateMainImage(contentToDisplay.image, 'Video');
        }
        updateSelectedAnchorItem(index);
    })
}

export function sizesDropdown_change(event) {

    productOptions.Size = event.target.value;
    validateProductOptions();
}

async function validateProductOptions() {
    const sizeIsSelected = 'Size' in productOptions;

    const alertMessage = $w('#alert');
    const fadeOptions = { duration: 300 };

    alertMessage.hide('fade', fadeOptions);
    if (sizeIsSelected) {
        let curr = $w('#sizesDropdown').value
        if (curr.includes("OUT OF STOCK")) {
            $w('#addToCart').disable();
            $w('#addToCart').label = 'OUT OF STOCK'
            return false;
        } else {
            $w('#addToCart').enable();
            $w('#addToCart').label = 'ADD TO BAG'
            return true;
        }
    } else {
        alertMessage.show('fade', fadeOptions);
    }
}

async function validateProductOptionsMobile() {
    const sizeIsSelected = 'Size' in productOptions;

    const alertMessage = $w('#alertMobile');
    const fadeOptions = { duration: 300 };

    //alertMessage.hide('fade', fadeOptions);
    if (sizeIsSelected) {
        $w('#selectedSizeBox').expand()
        $w('#selectedSizeText').text = productOptions.Size
        $w('#addToCartMobile').label = 'ADD TO BAG'
        return true;
    } else {
        $w('#productOptionsBox').expand()
        //alertMessage.show('fade', fadeOptions);
    }
}
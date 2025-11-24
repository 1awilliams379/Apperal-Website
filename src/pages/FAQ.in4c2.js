var minus = "https://static.wixstatic.com/shapes/074041_320ce19f5f5a48628654db20a227260e.svg"
var plus = "wix:vector://v1/8189693b5f234183bca371c5590b5d42.svg/"
var contactUs = "https://ruccioculli.editorx.io/my-site/contactus"
var returnPolicy = ""
var aftercareForm = ''
var shopping = [{
        _id: getRandStr(10),
        question: "Why is shopping on Vuccio.com unique?",
        answer: '<p><span style="color: #ffffff;">Heritage, uniqueness and innovative spirit drive us to concquer the highest peaks of excellence.</span><br /><br /><span style="color: #ffffff;">Thanks to our numerous online and in-store services, you will be able to enjoy a seamless shopping experience.</span><br /><br /><span style="color: #ffffff;">Online orders can be placed using a wide range of secure payment methods and delivery options. You can choose to have them delivered at a private address or at one of our boutiques.</span></p>'
    },
    {
        _id: getRandStr(10),
        question: "Can I place an order through email?",
        answer: '<p><span style="color: #ffffff;">If you need advice or assistance, simply contact our</span>&nbsp;<a href=' + contactUs + ' target="_blank" rel="noopener"><span style="color: #ffffff;"><strong><span style="text-decoration: underline;">Client Service</span></strong></span></a>&nbsp;<span style="color: #ffffff;">to get started.</span> <span style="color: #ffffff;">Moncler style advisors are there for you!</span><br /><br /><span style="color: #ffffff;">When getting together at the check out of your new order, you can choose to receive a direct payment link to your email. You will finalize the payment operation with one click, in the safest way!</span></p>'
    },
    {
        _id: getRandStr(10),
        question: "Can I cancel or modify my order?",
        answer: '<p><span style="color: #ffffff;">As soon as you confirm your purchase online, we begin preparing the order to ensure timely delivery.</span><br /><br /><span style="color: #ffffff;">Should you need to cancel your order before shipping,&nbsp;<a style="color: #ffffff;" href=' + contactUs + ' target="_blank" rel="noopener"><span style="text-decoration: underline;">contact us</span></a>&nbsp;and we will do our best to accommodate your request if the packing of the garments has not been initiated yet.</span><br /><br /><span style="color: #ffffff;">In case the order has already been shipped, you will be eligible to return or exchange your selected item/s following our&nbsp;<span style="text-decoration: underline;"><a style="color: #ffffff; text-decoration: underline;" href=' + returnPolicy + ' target="_blank" rel="noopener">Return Policy</a></span>.</span></p>'
    }
]

var productAftercare = [{
        _id: getRandStr(10),
        question: "Can you assist me with my product?",
        answer: '<p><span style="color: #ffffff;">If you need further assistance or if you have any questions about your product, you may:</span><br /><br /><span style="color: #ffffff;">&bull; For online purchases or purchases from other stores, you can contact our Client Service by filling in the following</span>&nbsp;<a href=' + aftercareForm + ' target="_blank" rel="noopener"><span style="text-decoration: underline; color: #ffffff;">Aftercare Form</span></a><span style="color: #ffffff;">.</span><br /><br /><span style="color: #ffffff;">Please remember to gather all possible details in order to be properly assisted.</span><br /><br /><span style="color: #ffffff;">We kindly inform you that not all repairs are possible, however we will do our best to offer assistance.</span><br /><br /><span style="color: #ffffff;">In this section you can find some tips for item care and maintenance.</span></p>'
    },
    {
        _id: getRandStr(10),
        question: "General care",
        answer: '<p><span style="color: #ffffff;">Care instructions can be found on:</span><br /><br /><span style="color: #ffffff;">&bull; Care labels available inside your Vuccio garment</span><br /><br /><span style="color: #ffffff;">&bull; Composition and care information available in the item page on Vuccio.com</span><br /><br /><span style="color: #ffffff;">For proper care, instructions on the garment\'s internal label should be strictly followed.</span><br /><br /><span style="color: #ffffff;">Avoid contact with oil or alcohol-based substances such as perfumes, cosmetics, hand sanitizers, which might impact the fabric and cause unremovable stains.</span><br /><br /><span style="color: #ffffff;">In case of large stains, we recommend to clean the item promptly to avoid the stain penetrating inside the garment materials.</span><br /><span style="color: #ffffff;">Before cleaning we recommend to cover accessories (e.g. zip pull tabs) to avoid possible damages to item fabric or to accessories during the cleaning process.</span><br /><br /><span style="color: #ffffff;">Contact with heavily textured surfaces might damage fabric, cause pulled threads and scratches on areas of greatest use and on edges. We recommend to avoid such surfaces to preserve item integrity.</span><br /><br /><span style="color: #ffffff;">Store your item in a cool dry place and avoid prolonged exposure to direct light, heat or moisture sources.</span><br /><span style="color: #ffffff;">Over-packing and folds can permanently ruin embroideries, artwork, pearls, studs, real and fake fur, leather inserts and other delicate parts. We advise careful storage.</span><br /><span style="color: #ffffff;">It is also suggested to take the item out from storage and let the item breathe from time to time.</span></p>'
    },
    {
        _id: getRandStr(10),
        question: "Ready-To-Wear",
        answer: '<p><span style="color: #ffffff;">Please always refer to care labels available inside your Vuccio garment for specific cleaning instructions.</span><br /><br /><span style="color: #ffffff;">If allowed by the instructions, items may be cleaned at home. When cleaning your item at home, we recommend paying particular attention to:</span><br /><br /><span style="color: #ffffff;">&bull; Not overloading the washing machine, if washing machine cleaning is permitted</span><br /><br /><span style="color: #ffffff;">&bull; Avoid soaking</span><br /><br /><span style="color: #ffffff;">&bull; Use laundry bags, especially for soft tricot garments</span><br /><br /><span style="color: #ffffff;">&bull; Iron on reverse</span><br /><br /><span style="color: #ffffff;">&bull; In case of soft textiles, brush the item at the end of the cleaning process - use a dedicated adhesive brush</span><br /><br /><span style="color: #ffffff;">Furs and leathers can be entrusted to a specialist.</span><br /><br /><span style="color: #ffffff;">For storage, we recommend not hanging the item up and not compressing the item. This might stretch the fabric fibres and alter the garment\'s original shape.</span><br /><br /><span style="color: #ffffff;">In case of knitwear garments (e.g. cashmere, mohair, etc&hellip;) we suggest to avoid many days of consecutive wear. This will allow the knitted fibers adequate rest time, for the benefit of the item\'s esthetic integrity.</span></p>'
    }
]

var sizeGuide = [{
    _id: getRandStr(10),
    question: "How can I choose the right size for me?",
    answer: '<p><span style="color: #ffffff;">Vuccio has created a universal sizing system that aims to provide a unique reference for all countries.</span><br /><br /><span style="color: #ffffff;">You can easily spot the best size for you by referring to our Size Guide that provides a conversion table to all major country size systems.</span><br /><br /><span style="color: #ffffff;">The Size Guide is conveniently available on the page of each product.</span><br /><br /><span style="color: #ffffff;">For any size and fit inquiries, do not hesitate to&nbsp;<span style="text-decoration: underline;"><a style="color: #ffffff; text-decoration: underline;" href=' + contactUs + ' target="_blank" rel="noopener">contact us</a></span>.</span></p>'
}]

var payments = [{
        _id: getRandStr(10),
        question: "Can you assist me with my product?",
        answer: '<p><span style="color: #ffffff;">If you need further assistance or if you have any questions about your product, you may:</span><br /><br /><span style="color: #ffffff;">&bull; For online purchases or purchases from other stores, you can contact our Client Service by filling in the following</span>&nbsp;<a href=' + aftercareForm + ' target="_blank" rel="noopener"><span style="text-decoration: underline; color: #ffffff;">Aftercare Form</span></a><span style="color: #ffffff;">.</span><br /><br /><span style="color: #ffffff;">Please remember to gather all possible details in order to be properly assisted.</span><br /><br /><span style="color: #ffffff;">We kindly inform you that not all repairs are possible, however we will do our best to offer assistance.</span><br /><br /><span style="color: #ffffff;">In this section you can find some tips for item care and maintenance.</span></p>'
    },
    {
        _id: getRandStr(10),
        question: "General care",
        answer: '<p><span style="color: #ffffff;">Care instructions can be found on:</span><br /><br /><span style="color: #ffffff;">&bull; Care labels available inside your Vuccio garment</span><br /><br /><span style="color: #ffffff;">&bull; Composition and care information available in the item page on Vuccio.com</span><br /><br /><span style="color: #ffffff;">For proper care, instructions on the garment\'s internal label should be strictly followed.</span><br /><br /><span style="color: #ffffff;">Avoid contact with oil or alcohol-based substances such as perfumes, cosmetics, hand sanitizers, which might impact the fabric and cause unremovable stains.</span><br /><br /><span style="color: #ffffff;">In case of large stains, we recommend to clean the item promptly to avoid the stain penetrating inside the garment materials.</span><br /><span style="color: #ffffff;">Before cleaning we recommend to cover accessories (e.g. zip pull tabs) to avoid possible damages to item fabric or to accessories during the cleaning process.</span><br /><br /><span style="color: #ffffff;">Contact with heavily textured surfaces might damage fabric, cause pulled threads and scratches on areas of greatest use and on edges. We recommend to avoid such surfaces to preserve item integrity.</span><br /><br /><span style="color: #ffffff;">Store your item in a cool dry place and avoid prolonged exposure to direct light, heat or moisture sources.</span><br /><span style="color: #ffffff;">Over-packing and folds can permanently ruin embroideries, artwork, pearls, studs, real and fake fur, leather inserts and other delicate parts. We advise careful storage.</span><br /><span style="color: #ffffff;">It is also suggested to take the item out from storage and let the item breathe from time to time.</span></p>'
    },
    {
        _id: getRandStr(10),
        question: "Ready-To-Wear",
        answer: '<p><span style="color: #ffffff;">Please always refer to care labels available inside your Vuccio garment for specific cleaning instructions.</span><br /><br /><span style="color: #ffffff;">If allowed by the instructions, items may be cleaned at home. When cleaning your item at home, we recommend paying particular attention to:</span><br /><br /><span style="color: #ffffff;">&bull; Not overloading the washing machine, if washing machine cleaning is permitted</span><br /><br /><span style="color: #ffffff;">&bull; Avoid soaking</span><br /><br /><span style="color: #ffffff;">&bull; Use laundry bags, especially for soft tricot garments</span><br /><br /><span style="color: #ffffff;">&bull; Iron on reverse</span><br /><br /><span style="color: #ffffff;">&bull; In case of soft textiles, brush the item at the end of the cleaning process - use a dedicated adhesive brush</span><br /><br /><span style="color: #ffffff;">Furs and leathers can be entrusted to a specialist.</span><br /><br /><span style="color: #ffffff;">For storage, we recommend not hanging the item up and not compressing the item. This might stretch the fabric fibres and alter the garment\'s original shape.</span><br /><br /><span style="color: #ffffff;">In case of knitwear garments (e.g. cashmere, mohair, etc&hellip;) we suggest to avoid many days of consecutive wear. This will allow the knitted fibers adequate rest time, for the benefit of the item\'s esthetic integrity.</span></p>'
    }
]

$w.onReady(function () {
    setRepeaters()
});

function setRepeaters() {
    $w('#shoppingFAQRepeater').data = shopping
    $w('#productAftercareFAQRepeater').data = productAftercare
    $w('#sizeGuideFAQRepeater').data = sizeGuide
    $w('#paymentsFAQRepeater').data = payments

}

function getRandStr(length = 10) {
    return Math.random().toString(20).substr(2, length)
}

export function shippingFAQRepeater_itemReady($item, itemData) {
    // $item('#boxIcon').st
    $item('#questionText').text = itemData.question
    $item('#answerText').html = itemData.answer
    $item('#questionBox').onClick(() => {
        if ($item('#answerBox').collapsed) {
            $w('#shoppingFAQRepeater').forEachItem($ite => {
                $ite('#answerBox').collapse()
            })

            $item('#answerBox').expand()
            $item('#boxIcon').src = minus
        } else {
            $item('#answerBox').collapse()
            $item('#boxIcon').src = plus
        }

    })

}

export function productAftercareFAQRepeater_itemReady($item, itemData) {
    // $item('#boxIcon').st
    $item('#pAQuestionText').text = itemData.question
    $item('#pAAnswerText').html = itemData.answer
    $item('#pAQuestionBox').onClick(() => {
        if ($item('#pAAnswerBox').collapsed) {
            $w('#productAftercareFAQRepeater').forEachItem($ite => {
                $ite('#pAAnswerBox').collapse()
            })

            $item('#pAAnswerBox').expand()
            $item('#pABoxIcon').src = minus
        } else {
            $item('#pAAnswerBox').collapse()
            $item('#pABoxIcon').src = plus
        }

    })

}

export function sizeGuideFAQRepeater_itemReady($item, itemData) {
    // $item('#boxIcon').st
    $item('#sGQuestionText').text = itemData.question
    $item('#sGAnswerText').html = itemData.answer
    $item('#sGQuestionBox').onClick(() => {
        if ($item('#sGAnswerBox').collapsed) {
            $w('#sizeGuideFAQRepeater').forEachItem($ite => {
                $ite('#sGAnswerBox').collapse()
            })

            $item('#sGAnswerBox').expand()
            $item('#sGBoxIcon').src = minus
        } else {
            $item('#sGAnswerBox').collapse()
            $item('#sGBoxIcon').src = plus
        }

    })

}

export function paymentsFAQRepeater_itemReady($item, itemData) {
    // $item('#boxIcon').st
    $item('#paymentsQuestionText').text = itemData.question
    $item('#paymentsAnswerText').html = itemData.answer
    $item('#paymentsQuestionBox').onClick(() => {
        if ($item('#paymentsAnswerBox').collapsed) {
            $w('#paymentsFAQRepeater').forEachItem($ite => {
                $ite('#paymentsAnswerBox').collapse()
            })

            $item('#paymentsAnswerBox').expand()
            $item('#paymentsBoxIcon').src = minus
        } else {
            $item('#paymentsAnswerBox').collapse()
            $item('#paymentsBoxIcon').src = plus
        }

    })

}
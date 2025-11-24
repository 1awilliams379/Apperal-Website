// API Reference: https://www.wix.com/velo/reference/api-overview/introduction
// “Hello, World!” Example: https://learn-code.wix.com/en/article/1-hello-world

import wixAnimations from 'wix-animations';
import wixLocation from 'wix-location';
import wixWindow from 'wix-window';

$w.onReady(function () {
	activateCardHover()
	activateCardFunction()
	mobileSetup()
});

function mobileSetup() {
	if(wixWindow.formFactor === "Mobile") {
		const cards = ['#card01','#card02','#card03','#card04','#card05'];
		cards.forEach(card => {
			const topScreen = $w(card).children[1];
			const bottomScreen = $w(card).children[2];
			topScreen.collapse()
			bottomScreen.collapse()

		})
	}
}

function activateCardHover() {
	const cards = ['#card01','#card02','#card03','#card04','#card05'];

	cards.forEach(card => {
		const topScreen = $w(card).children[1];
		const bottomScreen = $w(card).children[2];
		$w(card).onMouseIn(() => {
			wixAnimations.timeline()
			.add(topScreen, { y: -500, duration: 250 })
			.add(bottomScreen, { y: 500, duration: 250 }, 0)
			.play()
		})
		$w(card).onMouseOut(() => {
			wixAnimations.timeline()
			.add(topScreen, { y: 0, duration: 500 })
			.add(bottomScreen, { y: 0, duration: 500 }, 0)
			.play()
		})
	})
}

function activateCardFunction() {
	const card1 = $w('#card01');
	const card2 = $w('#card02');
	const card3 = $w('#card03');
	const card4 = $w('#card04');
	const card5 = $w('#card05');

	card1.onClick(() => {
		let baseUrl = wixLocation.baseUrl
        var sk = "0001~01~BLK".split("~")
        const locale = sk[0] + sk[1] + (sk[2].toLowerCase())
        console.log(locale)
        wixLocation.to(baseUrl + "/product/" + locale)
	})

	card2.onClick(() => {
		let baseUrl = wixLocation.baseUrl
        var sk = "0002~05~BLK".split("~")
        const locale = sk[0] + sk[1] + (sk[2].toLowerCase())
        console.log(locale)
        wixLocation.to(baseUrl + "/product/" + locale)
	})

	card3.onClick(() => {
		let baseUrl = wixLocation.baseUrl
        var sk = "0002~05~CRE".split("~")
        const locale = sk[0] + sk[1] + (sk[2].toLowerCase())
        console.log(locale)
        wixLocation.to(baseUrl + "/product/" + locale)
	})

	card4.onClick(() => {
		let baseUrl = wixLocation.baseUrl
        var sk = "0001~04~BLK".split("~")
        const locale = sk[0] + sk[1] + (sk[2].toLowerCase())
        console.log(locale)
        wixLocation.to(baseUrl + "/product/" + locale)
	})

	card5.onClick(() => {
		let baseUrl = wixLocation.baseUrl
        var sk = "0001~02~BLK".split("~")
        const locale = sk[0] + sk[1] + (sk[2].toLowerCase())
        console.log(locale)
        wixLocation.to(baseUrl + "/product/" + locale)
	})
}
import {fetch} from 'wix-fetch';

////////////////////////////////////////////////
// A "test key" is used for this example.
// Use a "live key" for a production site.
// Go to stripe.com to get your own key.
// https://stripe.com/docs/keys  
const apiKey = "pk_test_51KFC0LC5OEOblDOb4u1iVI11Q0diBkUKdgxm9yl3Ru1M9sYOadHYc8Sf0gLs9juuzdB2kzPDtWpC27YTQRqUJvhw008p7X4Bwf"; // (public key)
// The publishable key is just used to identify your account.
// It does not provide permission to perform any function
// except for creating a token, and can therefore be used
// in a public file.
////////////////////////////////////////////////

// This function uses the Stripe API to get a card token.
// A card token is a secure representation of the card
// and can only be used once.
// https://stripe.com/docs/api#create_card_token
export async function createToken(card) {

	const response = await fetch("https://api.stripe.com/v1/tokens", {
		method: 'post',
		headers: {
			"Content-Type": "application/x-www-form-urlencoded",
			"Authorization": "Bearer " + apiKey
		},
		body: card
	});
	if (response.status >= 200 && response.status < 300) {
		const json = await response.json()
		return json.id;
	}
	const responseText = await response.text();
	return response.status;
}

// Builds the fetch body from the array of card details.
export function encodeCard(card) {
	let encoded = "";
	for (let [k, v] of Object.entries(card)) {
		encoded = encoded.concat("card[", k, "]=", encodeURI(v), "&");
	}
	return encoded.substr(0, encoded.length - 1);
}
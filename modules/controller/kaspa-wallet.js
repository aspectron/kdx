import {KaspaWallet as BaseKaspaWallet} from '/node_modules/@kaspa/ux/kaspa-ux.js';

class KaspaWallet extends BaseKaspaWallet{
	makeFaucetRequest(subject, args){
		let origin = 'https://faucet.kaspanet.io';
		//origin = 'http://localhost:3000';
		const {address, amount} = args;
		let path = {
			'faucet-available': `available/${address}`,
			'faucet-request': `get/${address}/${amount}`
		}[subject];

		if(!path)
			return Promise.reject("Invalid request subject:"+subject)

		return fetch(`${origin}/api/${path}`, {
			method: 'GET'
		}).then(res => res.json())
	}
}

KaspaWallet.define("kaspa-wallet")

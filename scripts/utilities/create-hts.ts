import hardhat from 'hardhat';
import {Hashgraph} from "../../utils/hashgraph";

async function createHTS(hederanetwork: string, name: string, symbol: string, supply = 200000000000) {
	// @ts-ignore
	let signers = await hardhat.hethers.getSigners();
	let clientAccount = signers[0]._signer.account;
	let clientPK = signers[0]._signingKey().privateKey;

	const client = Hashgraph.clientFor(hederanetwork).setOperator(clientAccount, clientPK);
	const token = await Hashgraph.deployToken(client, clientPK, name, symbol, supply);

	// @ts-ignore
	console.log(`HTS Token Deployed at: ${token.tokenAddress} with id ${token.tokenId}`);

	return token;
}

module.exports = createHTS;

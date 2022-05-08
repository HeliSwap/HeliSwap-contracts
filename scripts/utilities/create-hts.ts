import hardhat from 'hardhat';
import {Hashgraph} from "../../utils/hashgraph";

async function createHTS(network: string, name: string, symbol: string, supply = 100000000000) {
	// @ts-ignore
	let signers = await hardhat.hethers.getSigners();
	let clientAccount = signers[0]._signer.account;
	let clientPK = signers[0]._signingKey().privateKey;

	const client = Hashgraph.clientFor(network).setOperator(clientAccount, clientPK);
	const token = await Hashgraph.deployToken(client, clientPK, name, symbol, supply);

	console.log(`HTS Token Deployed at: ${token}`);
}

module.exports = createHTS;
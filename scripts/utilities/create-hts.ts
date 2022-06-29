import hardhat from 'hardhat';
import {Hashgraph} from "../../utils/hashgraph";
import {hethers} from "@hashgraph/hethers";
import {Utils} from "../../utils/utils";
import expandTo8Decimals = Utils.expandTo8Decimals;

async function createHTS(name: string, symbol: string, supply = expandTo8Decimals(2000)) {
	// @ts-ignore
	let signers = await hardhat.hethers.getSigners();
	let clientAccount = signers[0]._signer.account;
	let clientPK = signers[0]._signingKey().privateKey;

	const client = Hashgraph.clientFor(hardhat.network.name).setOperator(clientAccount, clientPK);
	const token = await Hashgraph.deployToken(client, clientPK, name, symbol, supply);

	// @ts-ignore
	console.log(`HTS Token Deployed at: ${token.tokenAddress} with id ${token.tokenId}`);
	// @ts-ignore
	return token;
}

module.exports = createHTS;

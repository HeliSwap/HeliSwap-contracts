// @ts-nocheck
import hardhat from 'hardhat';
import {AccountBalanceQuery, PrivateKey} from "@hashgraph/sdk";
import {Hashgraph} from "../../utils/hashgraph";

async function getAccountBalance(accountId: string) {
	const [signer] = await hardhat.hethers.getSigners();
	const client = Hashgraph.clientFor(hardhat.network.name)
        .setOperator(signer._signer.account, PrivateKey.fromStringECDSA(signer._signingKey().privateKey));

	const query = new AccountBalanceQuery().setAccountId(accountId);
	const resp = await query.execute(client);
	console.log(resp.toJSON());
}

module.exports = getAccountBalance;

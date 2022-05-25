// @ts-nocheck
import hardhat from 'hardhat';
import {ContractId, ContractInfoQuery, PrivateKey} from "@hashgraph/sdk";
import {Hashgraph} from "../../utils/hashgraph";

async function getContractInfo(pairAddr: string) {
	const [signer] = await hardhat.hethers.getSigners();
	const client = Hashgraph.clientFor(hardhat.network.name)
        .setOperator(signer._signer.account, PrivateKey.fromStringECDSA(signer._signingKey().privateKey));

	const query = new ContractInfoQuery().setContractId(ContractId.fromEvmAddress(0, 0, pairAddr));
	const resp = await query.execute(client);
	console.log(resp);
	for (let el of resp.tokenRelationships.__map) {
		console.log(el);
	}
}

module.exports = getContractInfo;

// @ts-nocheck
import hardhat from 'hardhat';
import {hethers} from "@hashgraph/hethers";
import {Client, ContractId, ContractInfoQuery, PrivateKey} from "@hashgraph/sdk";
import {asAccountString} from "@hashgraph/hethers/lib/utils";

async function getPair(pairAddr) {
    const [signer] = await hardhat.hethers.getSigners();
    const network = {
            "127.0.0.1:50211":"0.0.3"
    };
    const client = hardhat.network.name == 'local' ? Client.forNetwork(network) : Client.forPreviewnet();
    client.setOperator(signer._signer.account, PrivateKey.fromStringECDSA(signer._signingKey().privateKey));

    const query = new ContractInfoQuery().setContractId(ContractId.fromEvmAddress(0, 0, pairAddr));
    const resp = await query.execute(client);
    console.log(resp);
    for(let el of resp.tokenRelationships.__map) {
        console.log(el);
    }
}

module.exports = getPair;

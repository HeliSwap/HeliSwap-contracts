// @ts-nocheck
import hardhat from 'hardhat';
import {PrivateKey, TransactionRecordQuery} from "@hashgraph/sdk";
import {Hashgraph} from "../../utils/hashgraph";

async function getTxRecord(txId: string) {
    const [signer] = await hardhat.hethers.getSigners();
    const client = Hashgraph.clientFor(hardhat.network.name)
        .setOperator(signer._signer.account, PrivateKey.fromStringECDSA(signer._signingKey().privateKey));

    const query = new TransactionRecordQuery().setTransactionId(txId);
    const resp = await query.execute(client);
    console.log(resp);
}

module.exports = getTxRecord;

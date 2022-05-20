import hardhat from 'hardhat';
import {Hashgraph} from "../../utils/hashgraph";

async function transferHTS(accountid: string, tokenid: string, amount: number) {
    // @ts-ignore
    let signers = await hardhat.hethers.getSigners();
    let clientAccount = signers[0]._signer.account;
    let clientPK = signers[0]._signingKey().privateKey;

    const client = Hashgraph.clientFor(hardhat.network.name).setOperator(clientAccount, clientPK);
    await Hashgraph.transferToken(client, clientPK, accountid, tokenid, amount);

    console.log(`Transferred ${amount} HTS Token ${tokenid} to : ${accountid}`);
}

module.exports = transferHTS;

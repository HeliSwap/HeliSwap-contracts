import {Hashgraph} from "../../utils/hashgraph";
import hardhat from 'hardhat';

async function approveHTS(accountid: string, pk: string, spenderAccountId: string, tokenid: string, amount: number) {
    const client = Hashgraph.clientFor(hardhat.network.name).setOperator(accountid, pk);
    await Hashgraph.approveToken(client, pk, accountid, spenderAccountId, tokenid, amount);

    console.log(`${accountid} approved ${amount} of HTS Token ${tokenid} to be spent by ${spenderAccountId}`);
}

module.exports = approveHTS;

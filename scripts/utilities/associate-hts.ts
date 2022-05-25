import {Hashgraph} from "../../utils/hashgraph";
import hardhat from 'hardhat';

async function associateHTS(accountid: string, pk: string, tokenid: string) {
    const client = Hashgraph.clientFor(hardhat.network.name).setOperator(accountid, pk);
    await Hashgraph.associateToken(client, pk, accountid, tokenid);

    console.log(`HTS Token ${tokenid} Associated to : ${accountid}`);
}

module.exports = associateHTS;

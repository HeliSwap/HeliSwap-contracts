import {Hashgraph} from "../../utils/hashgraph";

async function associateHTS(hederanetwork: string, accountid: string, pk: string, tokenid: string) {
    const client = Hashgraph.clientFor(hederanetwork).setOperator(accountid, pk);
    await Hashgraph.associateToken(client, pk, accountid, tokenid);

    console.log(`HTS Token ${tokenid} Associated to : ${accountid}`);
}

module.exports = associateHTS;

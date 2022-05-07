// @ts-nocheck
import {
    Client,
    AccountCreateTransaction,
    PublicKey,
    Hbar
} from "@hashgraph/sdk";

async function generateAccounts(num = 3) {
    // Local Network
    // const network = {
    //     "127.0.0.1:50211": "0.0.3",
    // };
    // const client = Client
    //     .forNetwork(network);
    // client
    //     .setOperator('0.0.2', '302e020100300506032b65700422042091132178e72057a1d7528025956fe39b0b847f200ab59b2fdd367017f3087137');

    const client = Client
    	.forPreviewnet();
    client
    	.setOperator('0.0.12811', '302e020100300506032b6570042204206d79b87273cd4e1b71fe10236c790419a558946996ec834fccc66760ebc2ec41');

    for (let i = 0; i < num; i++) {
        const randomWallet = hethers.Wallet.createRandom();
        const tx = await new AccountCreateTransaction()
            .setKey(PublicKey.fromString(randomWallet._signingKey().compressedPublicKey))
            .setInitialBalance(Hbar.fromTinybars(100000000000))
            .execute(client);
        const getReceipt = await tx.getReceipt(client);

        console.log(getReceipt.accountId.toString());
        console.log(randomWallet._signingKey().privateKey);
    }
}

module.exports = generateAccounts;

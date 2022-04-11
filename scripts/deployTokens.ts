// @ts-nocheck
import hardhat from 'hardhat';
import {
    Client,
    PrivateKey,
    TokenAssociateTransaction,
    TokenCreateTransaction,
    TransactionId,
    TransferTransaction
} from "@hashgraph/sdk";

async function deployTokens() {
    let date = new Date();
    console.log(date)
    date.setDate(date.getDate() + 1);
    console.log(date)

    let signers = await hardhat.hethers.getSigners();

    let defaultAccount = signers[0]._signer.account;
    let defaultPrivKey = signers[0]._signingKey().privateKey;

    let aliceAccount = signers[1]._signer.account;
    let alicePrivKey = signers[1]._signingKey().privateKey;

    let bobAccount = signers[2]._signer.account;
    let bobPrivKey = signers[2]._signingKey().privateKey;

    // Preview Network
    let defaultClient = Client.forTestnet();
    let aliceClient = Client.forTestnet();
    let bobClient = Client.forTestnet();

    // Local Network
    // const network = {
    //     "127.0.0.1:50211": "0.0.3",
    // };
    // let defaultClient = Client.forNetwork(network);
    // let aliceClient = Client.forNetwork(network);
    // let bobClient = Client.forNetwork(network);

    // 3rd party
    defaultClient.setOperator(defaultAccount, defaultPrivKey);
    aliceClient.setOperator(aliceAccount, alicePrivKey);
    bobClient.setOperator(bobAccount, bobPrivKey);

    let tokens = [{
        TOKEN_SYMBOL: "RPT",
        TOKEN_NAME: "Rug Pull Token",
        TOKEN_SUPPLY: 200000000000,
    },{
        TOKEN_SYMBOL:"PNDT",
        TOKEN_NAME:"Pump N Dump Token",
        TOKEN_SUPPLY: 200000000000,
    }]

    const tokenContracts = [];
    for (let i = 0; i <= 1; i++) {
        try {
            const tokenName = tokens[i].TOKEN_NAME;
            const tokenSymbol = tokens[i].TOKEN_SYMBOL;
            const tokenSupply = tokens[i].TOKEN_SUPPLY;

            const tokenCreate = await (await new TokenCreateTransaction()
                .setTokenName(tokenName)
                .setTokenSymbol(tokenSymbol)
                .setExpirationTime(date)
                .setDecimals(8)
                .setInitialSupply(tokenSupply)
                .setTreasuryAccountId(defaultAccount)
                .setTransactionId(TransactionId.generate(defaultAccount))
                .setNodeAccountIds([defaultClient._network.getNodeAccountIdsForExecute()[0]])
                .freeze()
                .sign(PrivateKey.fromStringECDSA(defaultPrivKey)))
                .execute(defaultClient);
            const receipt = await tokenCreate.getReceipt(defaultClient);
            const tokenAddress = hethers.utils.getAddressFromAccount(receipt.tokenId);
            tokenContracts.push({evmAddress: tokenAddress, tokenId: receipt.tokenId});
            console.log('Deployed token contract for', tokenSymbol, 'at:', tokenAddress, receipt.tokenId.toString());

            const tokenAssociateAlice = await (await new TokenAssociateTransaction()
                .setAccountId(aliceAccount)
                .setTokenIds([receipt.tokenId])
                .freezeWith(aliceClient)
                .sign(PrivateKey.fromStringECDSA(alicePrivKey)))
                .execute(aliceClient);
            const associateAliceReceipt = await tokenAssociateAlice.getReceipt(aliceClient);

            const tokenAssociateBob = await (await new TokenAssociateTransaction()
                .setAccountId(bobAccount)
                .setTokenIds([receipt.tokenId])
                .freezeWith(bobClient)
                .sign(PrivateKey.fromStringECDSA(bobPrivKey)))
                .execute(bobClient);
            const associateBobReceipt = await tokenAssociateBob.getReceipt(bobClient);

            const tokenTransfer = await (await new TransferTransaction()
                .addTokenTransfer(receipt.tokenId, defaultAccount, -100000000000)
                .addTokenTransfer(receipt.tokenId, aliceAccount, 100000000000)
                .freezeWith(defaultClient)
                .sign(PrivateKey.fromStringECDSA(defaultPrivKey)))
                .execute(defaultClient);
            const tokenTransferReceipt = await tokenTransfer.getReceipt(defaultClient);
        } catch (e) {
            console.log(e);
            // noop
        }
    }
}

module.exports = deployTokens;

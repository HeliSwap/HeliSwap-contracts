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
import {getAddressFromAccount} from "@hashgraph/hethers/lib/utils";
import {hethers} from "@hashgraph/hethers";

async function deployTokens() {
    let signers = await hardhat.hethers.getSigners();
    let defaultAccount = signers[0]._signer.account;
    let defaultPrivKey = signers[0]._signingKey().privateKey;

    let aliceAccount = signers[1]._signer.account;
    let alicePrivKey = signers[1]._signingKey().privateKey;

    let bobAccount = signers[2]._signer.account;
    let bobPrivKey = signers[2]._signingKey().privateKey;

    const network = {
        "127.0.0.1:50211": "0.0.3",
    };
    let defaultClient = hardhat.network.name == 'local'? Client.forNetwork(network) : Client.forTestnet();
    let aliceClient = hardhat.network.name == 'local'? Client.forNetwork(network) : Client.forTestnet()
    let bobClient = hardhat.network.name == 'local'? Client.forNetwork(network) : Client.forTestnet()

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
    const contract = await hardhat.hethers.getContractFactory("Token");
    const tokenContracts = [];
    const amount = 100000000;

    for (let i = 0; i <= 1; i++) {
        try {
            const tokenName = tokens[i].TOKEN_NAME;
            const tokenSymbol = tokens[i].TOKEN_SYMBOL;
            const tokenSupply = tokens[i].TOKEN_SUPPLY;

            const deployedToken = await contract.deploy(tokenName, tokenSymbol, tokenSupply, {gasLimit: 300000});

            const token = await hethers.ContractFactory.getContract(deployedToken.address, contract.interface, signers[0]._signer);
            const transferAmount = Math.fround(amount/3);
            console.log(`Deployed ${tokenSymbol} token at ${deployedToken.address}`);
            await token.transfer(getAddressFromAccount(aliceAccount), transferAmount, {gasLimit: 3000000});
            await token.transfer(getAddressFromAccount(bobAccount), transferAmount, {gasLimit: 3000000});
        } catch (e) {
            console.log(e);
            // noop
        }
    }
}

module.exports = deployTokens;

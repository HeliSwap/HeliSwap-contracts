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

async function approve(tokenAddr, spenderAddr, amount, lenderAccount, lenderPrivateKey) {
    const lenderWallet = new hardhat.hethers.Wallet({
        account: lenderAccount,
        privateKey: lenderPrivateKey
    }, tfactory.signer.provider);
    const token = await hardhat.hethers.getContractAt('MockToken', tokenAddr, lenderWallet);
    const approval = await token.approve(spenderAddr, amount);
    console.log(approval);
}

module.exports = approve;

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
    let signers = await hardhat.hethers.getSigners();
    const tfactory = await hardhat.hethers.getContractFactory('Token');
    const lenderWallet = new hardhat.hethers.Wallet({
        account: lenderAccount,
        privateKey: lenderPrivateKey
    }, tfactory.signer.provider);
    const token = await hardhat.hethers.ContractFactory.getContract(tokenAddr, tfactory.interface, lenderWallet);
    const approval = await token.approve(spenderAddr, amount, {gasLimit: 3000000});
    console.log(approval);

}

module.exports = approve;

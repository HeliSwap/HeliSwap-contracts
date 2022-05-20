// @ts-nocheck
import hardhat from 'hardhat';
import {Hashgraph} from "../../utils/hashgraph";

async function approve(tokenAddr, spenderAddr, amount, lenderAccount, lenderPrivateKey) {
    let client = Hashgraph.clientFor(hardhat.network.name)

    const lenderWallet = new hardhat.hethers.Wallet({
        account: lenderAccount,
        privateKey: lenderPrivateKey
    }, client);
    const token = await hardhat.hethers.getContractAt('MockToken', tokenAddr, lenderWallet);
    const approval = await token.approve(spenderAddr, amount);
    console.log(approval);
}

module.exports = approve;

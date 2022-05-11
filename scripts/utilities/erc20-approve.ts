// @ts-nocheck
import hardhat from 'hardhat';

async function approve(tokenAddr, spenderAddr, amount, lenderAccount, lenderPrivateKey) {
    const provider = await hardhat.hethers.getDefaultProvider("previewnet");
    const lenderWallet = new hardhat.hethers.Wallet({
        account: lenderAccount,
        privateKey: lenderPrivateKey
    }, provider);
    const token = await hardhat.hethers.getContractAt('MockToken', tokenAddr, lenderWallet);
    const approval = await token.approve(spenderAddr, amount, {gasLimit: 3000000});
    console.log(approval);
}

module.exports = approve;

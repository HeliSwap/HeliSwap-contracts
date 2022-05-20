// @ts-nocheck
import hardhat from 'hardhat';

async function approve(tokenAddr, spenderAddr, amount, lenderAccount, lenderPrivateKey) {
    let providerNetwork = hardhat.network.name
    if (providerNetwork == 'local') {
        providerNetwork = "127.0.0.1:50211";
    }
    let provider = await hardhat.hethers.getDefaultProvider(providerNetwork)

    const lenderWallet = new hardhat.hethers.Wallet({
        account: lenderAccount,
        privateKey: lenderPrivateKey
    }, provider);
    const token = await hardhat.hethers.getContractAt('MockToken', tokenAddr, lenderWallet);
    const approval = await token.approve(spenderAddr, amount, {gasLimit: 300000});
    console.log(approval);
}

module.exports = approve;

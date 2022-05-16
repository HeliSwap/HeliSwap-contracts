// @ts-nocheck
import hardhat from 'hardhat';

async function approve(hederaNetwork, tokenAddr, spenderAddr, amount, lenderAccount, lenderPrivateKey) {
    const consensusNodeId = '0.0.3';
    const consensusNodeUrl = '127.0.0.1:50211';
    const mirrorNodeUrl = '1';
    let provider = new hethers.providers.HederaProvider(consensusNodeId, consensusNodeUrl, mirrorNodeUrl);

    if (hederaNetwork != 'local') {
        provider = await hardhat.hethers.getDefaultProvider(hederaNetwork);
    }

    const lenderWallet = new hardhat.hethers.Wallet({
        account: lenderAccount,
        privateKey: lenderPrivateKey
    }, provider);
    const token = await hardhat.hethers.getContractAt('MockToken', tokenAddr, lenderWallet);
    const approval = await token.approve(spenderAddr, amount, {gasLimit: 3000000});
    console.log(approval);
}

module.exports = approve;

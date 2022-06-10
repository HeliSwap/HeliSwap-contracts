// @ts-nocheck
import hardhat from 'hardhat';
import {Utils} from "../../utils/utils";
import getExpiry = Utils.getExpiry;

async function swap(routerAddress, token1EVMAddress, token2EVMAddress) {
    const router = await hardhat.hethers.getContractAt('UniswapV2Router02', routerAddress);
    const [signer] = await hardhat.hethers.getSigners();

    const swapTx = await router.swapExactTokensForTokens(
        5000000000,
        4000000000,
        [token1EVMAddress, token2EVMAddress],
        signer.address,
        getExpiry());
    const txReceipt = await swapTx.wait();
    console.log(`Swap TX: ${txReceipt.transactionHash}`)
}

module.exports = swap;

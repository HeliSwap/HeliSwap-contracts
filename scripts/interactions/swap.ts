// @ts-nocheck
import hardhat from 'hardhat';
import {Utils} from "../../utils/utils";
import getExpiry = Utils.getExpiry;

async function swap(routerAddress, token1EVMAddress, token2EVMAddress) {
    const router = await hardhat.hethers.getContractAt('UniswapV2Router02', routerAddress);
    const [signer] = await hardhat.hethers.getSigners();

    const swapTx = await router.swapExactTokensForTokens(
        5000000,
        3000000,
        [token1EVMAddress, token2EVMAddress],
        signer.address,
        getExpiry());
    console.log('Waiting for swapTx');
    console.log(swapTx)

    const reserves = await router.getReserves(token1EVMAddress, token2EVMAddress);
    console.log(`Reserves: ${reserves}`);

    return reserves
}

module.exports = swap;

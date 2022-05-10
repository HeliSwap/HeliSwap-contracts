// @ts-nocheck
import hardhat from 'hardhat';

async function swap(router, token1EVMAddress, token2EVMAddress) {
    const router = await hardhat.hethers.getContractAt('UniswapV2Router02', routerAddress);
    const [signer] = await hardhat.hethers.getSigners();

    const swapTx = await router.swapExactTokensForTokens(
        500,
        400,
        [token1EVMAddress, token2EVMAddress],
        signer.address,
        oneHourAfter.getTime());
    console.log('Waiting for swapTx');
    console.log(swapTx)

    const reserves = await reconnectedRouter.getReserves(token1EVMAddress, token2EVMAddress);
    console.log(`Reserves: ${reserves}`);

    return reserves
}

module.exports = swap;

// @ts-nocheck
import hardhat from 'hardhat';
import {Utils} from "../../utils/utils";
import getExpiry = Utils.getExpiry;

async function addLiquidityHbar(routerAddress: string, token0: string, amount0: string, hbarAmount: string) {
    const [signer] = await hardhat.hethers.getSigners();
    const router = await hardhat.hethers.getContractAt('UniswapV2Router02', routerAddress);
    const whbarAddress = await router.WHBAR();
    console.log(`Adding Liquidity to ${token0}/${whbarAddress}...`);

    const addLiquidityTx = await router.addLiquidityHBAR(
        token0,
        amount0,
        amount0,
        hbarAmount,
        signer.address,
        getExpiry(),
        {value: hbarAmount}
    );
    const txReceipt = await addLiquidityTx.wait();
    console.log(`Added Liquidity: ${txReceipt.transactionHash}`)

    const reserves = await router.getReserves(token0, whbarAddress);
    console.log(`Reserves: ${reserves}`);
}

module.exports = addLiquidityHbar;

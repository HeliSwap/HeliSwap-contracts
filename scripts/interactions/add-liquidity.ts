// @ts-nocheck
import hardhat from 'hardhat';
import {Utils} from "../../utils/utils";
import getExpiry = Utils.getExpiry;

async function addLiquidity(routerAddress: string, token0: string, amount0: string, token1: string, amount1: string) {
	const [signer] = await hardhat.hethers.getSigners();
	const router = await hardhat.hethers.getContractAt('UniswapV2Router02', routerAddress);
	console.log(`Adding Liquidity to ${token0}/${token1}...`);

	const addLiquidityTx = await router.addLiquidity(
		token0,
		token1,
		amount0,
		amount1,
		amount0,
		amount1,
		signer.address,
		getExpiry());
	const txReceipt = await addLiquidityTx.wait();
	console.log(`Added Liquidity: ${txReceipt.transactionHash}`)
}

module.exports = addLiquidity;

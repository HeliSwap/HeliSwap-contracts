// @ts-nocheck
import hardhat from 'hardhat';

const TEN_MINUTES = 600_000;

async function addLiquidity(routerAddress: string, token0: string, amount0: string, token1: string, amount1: string) {
	const signer = (await hardhat.hethers.getSigners())[0];
	const router = await hardhat.hethers.getContractAt('UniswapV2Router02', routerAddress);
	console.log(`Adding Liquidity to ${token0}/${token0}...`);

	const addLiquidityTx = await router.addLiquidity(
		token0,
		token0,
		amount0,
		amount1,
		amount0,
		amount1,
		signer.address,
		getExpiry());
	const txReceipt = await addLiquidityTx.wait();
	console.log(`Added Liquidity: ${txReceipt.hash}`)

	const reserves = await router.getReserves(token0, token1);
	console.log(`Reserves: ${reserves}`);
}

function getExpiry() {
	return (new Date()).getTime() + TEN_MINUTES;
}

module.exports = addLiquidity;

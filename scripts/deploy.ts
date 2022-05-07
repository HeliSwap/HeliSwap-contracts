// @ts-nocheck
import hardhat from 'hardhat';

async function deploy(whbar: string) {
	const gasLimitOverride = {gasLimit: 3000000};

	console.log(`Deploying HeliSwap Factory...`);
	const HeliSwapFactory = await hardhat.hethers.getContractFactory("UniswapV2Factory");
	const heliswapFactory = await HeliSwapFactory.deploy(hardhat.hethers.constants.AddressZero, gasLimitOverride);
	await heliswapFactory.deployed();

	console.log(`Deploying HeliSwap Router...`);
	const HeliSwapRouter = await hardhat.hethers.getContractFactory("UniswapV2Router02");
	const router = await HeliSwapRouter.deploy(heliswapFactory.address, whbar, gasLimitOverride);
	await router.deployed();

	console.log(`HeliSwap Factory Address: ${heliswapFactory.address}`);
	console.log(`HeliSwap Router Address: ${router.address}`);
}

module.exports = deploy;

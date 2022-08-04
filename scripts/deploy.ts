// @ts-nocheck
import hardhat from 'hardhat';

async function deploy(whbar: string, feeToSetter: string) {
	console.log(`Deploying HeliSwap Factory...`);
	const HeliSwapFactory = await hardhat.hethers.getContractFactory("UniswapV2Factory");
	const factory = await HeliSwapFactory.deploy(feeToSetter);
	await factory.deployed();

	console.log(`Deploying HeliSwap Router...`);
	const HeliSwapRouter = await hardhat.hethers.getContractFactory("UniswapV2Router02");
	const router = await HeliSwapRouter.deploy(factory.address, whbar);
	await router.deployed();

	console.log(`HeliSwap Factory Address: ${factory.address}`);
	console.log(`HeliSwap Router Address: ${router.address}`);

	return { router, factory };
}

module.exports = deploy;

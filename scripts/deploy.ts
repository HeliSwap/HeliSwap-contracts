// @ts-nocheck
import hardhat from 'hardhat';

async function deploy(whbar: string) {

	console.log(`Deploying HeliSwap Factory...`);
	const HeliSwapFactory = await hardhat.hethers.getContractFactory("UniswapV2Factory");
	const heliswapFactory = await HeliSwapFactory.deploy(hardhat.hethers.constants.AddressZero);
	// await heliswapFactory.deployed();

	console.log(`Deploying HeliSwap Router...`);
	const HeliSwapRouter = await hardhat.hethers.getContractFactory("UniswapV2Router02");
	const router = await HeliSwapRouter.deploy(heliswapFactory.address, whbar);
	// await router.deployed();

	console.log(`HeliSwap Factory Address: ${heliswapFactory.address}`);
	console.log(`HeliSwap Router Address: ${router.address}`);
}

module.exports = deploy;

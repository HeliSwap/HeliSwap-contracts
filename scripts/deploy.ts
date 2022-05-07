// @ts-nocheck
import hardhat from 'hardhat';

async function deploy() {
	console.log(`Starting HeliSwap deployment...`);
	const gasLimitOverride = {gasLimit: 3000000};

	/**
	 * Deploying UniswapV2Factory
	 */
	const UniswapV2FactoryFactory = await hardhat.hethers.getContractFactory("UniswapV2Factory");
	const UniswapV2Factory = await UniswapV2FactoryFactory.deploy(hardhat.hethers.constants.AddressZero, gasLimitOverride);

	await UniswapV2Factory.deployed();
	console.log(`Factory Address: ${UniswapV2Factory.address}`);

	/**
	 * Deploying UniswapV2Router
	 */
	// TODO: create actual WHBAR_ADDRESS
	const WHBAR_ADDRESS = hardhat.hethers.constants.AddressZero;
	const UniswapV2RouterFactory = await hardhat.hethers.getContractFactory("UniswapV2Router02");
	const UniswapV2Router = await UniswapV2RouterFactory.deploy(UniswapV2Factory.address, WHBAR_ADDRESS, gasLimitOverride);

	// Comment this line when not using locally
	await UniswapV2Router.deployed();
	console.log(UniswapV2Router.address)

	return UniswapV2Router
}

module.exports = deploy;

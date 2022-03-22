import hardhat, {ethers} from 'hardhat';

async function deploy() {
	// console.log("someoeme")
	//@ts-ignore
	let signers = await hardhat.hethers.getSigners();

	// @ts-ignore
	// console.log(hardhat.network.config)
	console.log(hardhat.hethers)
	// console.log(signers);

	// await hardhat.run('compile');
	const gasLimitOverride = {gasLimit: 3000000};

	/**
	 * Deploying UniswapV2Factory
	 */
		//@ts-ignore
	const UniswapV2Factory = await hardhat.hethers.getContractFactory("UniswapV2Factory");
	//@ts-ignore
	console.log(hardhat.hethers.constants.AddressZero)
	//@ts-ignore
	const greeter = await UniswapV2Factory.deploy(hardhat.hethers.constants.AddressZero, gasLimitOverride);
	await greeter.deployed();

	// console.log("UniswapV2Factory deployed to:", greeter.address);

	/**
	 * Verifying Contracts
	 */
	// console.log('Verifying UniswapV2Factory on Etherscan...');
	// await hardhat.run('verify:verify', {
	// 	address: greeter.address,
	// 	constructorArguments: []
	// });
}

module.exports = deploy;

// @ts-nocheck
import hardhat from 'hardhat';

async function deployERC20(name: string, symbol: string) {
	console.log(`Starting ERC20 deployment...`);

	const MockToken = await hardhat.hethers.getContractFactory("MockToken");
	const mockToken = await MockToken.deploy(name, symbol);
	await mockToken.deployed();
	console.log(`Mock Token Deployed At: ${mockToken.address}`);
	return mockToken.address;
}

module.exports = deployERC20;

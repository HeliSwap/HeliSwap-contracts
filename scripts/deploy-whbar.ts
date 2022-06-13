// @ts-nocheck
import hardhat from 'hardhat';

async function deployWhbar() {
	console.log(`Starting WHBAR deployment...`);

	const WHBAR = await hardhat.hethers.getContractFactory("WHBAR");
	const whbar = await WHBAR.deploy();
	await whbar.deployed();
	console.log(`WHBAR Deployed At: ${whbar.address}`);
	return whbar.address;
}

module.exports = deployWhbar;

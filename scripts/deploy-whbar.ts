// @ts-nocheck
import hardhat from 'hardhat';

async function deploy() {
	console.log(`Starting WHBAR deployment...`);
	const gasLimitOverride = {gasLimit: 3000000};

	const WHBAR = await hardhat.hethers.getContractFactory("WHBAR");
	const whbar = await WHBAR.deploy(gasLimitOverride);
	await whbar.deployed();
	console.log(`WHBAR Deployed At: ${whbar.address}`);
}

module.exports = deploy;

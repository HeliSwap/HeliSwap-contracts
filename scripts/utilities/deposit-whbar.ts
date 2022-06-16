// @ts-nocheck
import hardhat from 'hardhat';

async function depositWhbar(whbarAddr: string, amount: number) {
	console.log(`Depositing WHBAR...`);
	const contract = await hardhat.hethers.getContractAt('WHBAR', whbarAddr);
	const depositTx = await contract.deposit({value: amount});
	await depositTx.wait();

	const supplyBefore = await contract.totalSupply();
	console.log(`WHBAR total supply ${hardhat.hethers.BigNumber.from(supplyBefore).toNumber()}`);
}

module.exports = depositWhbar;

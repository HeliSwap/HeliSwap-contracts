// @ts-nocheck
import hardhat from 'hardhat';
import {hethers} from "@hashgraph/hethers";

async function getReserves(routerAddress, token1EVMAddress, token2EVMAddress) {
	const router = await hardhat.hethers.getContractAt('UniswapV2Router02', routerAddress);

	try {
		const reserves = await router.getReserves(token1EVMAddress, token2EVMAddress);
		reserves.forEach(reserve => {
			console.log(`reserve${reserves.indexOf(reserve)}`, hethers.BigNumber.from(reserve).toNumber());
		});

		const factory = await router.factory();
		const factoryContract = await hardhat.hethers.getContractAt('UniswapV2Factory', factory);
		const pair = await factoryContract.getPair(token1EVMAddress, token2EVMAddress);
		console.log('Pair Address:', pair);
		const pairContract = await hardhat.hethers.getContractAt('UniswapV2Pair', pair);
		const supply = await pairContract.totalSupply();
		console.log('Pair Supply', hethers.BigNumber.from(supply).toNumber());
	} catch (e) {
		console.log(e)
	}
}

module.exports = getReserves;

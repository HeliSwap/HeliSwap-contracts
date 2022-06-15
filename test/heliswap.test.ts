import hardhat from "hardhat";
import {SignerWithAddress} from "hardhat-hethers/internal/signers";
import {BigNumber, Contract} from "@hashgraph/hethers";
import {Utils} from "../utils/utils";
import getExpiry = Utils.getExpiry;
import * as util from "util";
import {expect} from "chai";
import {getCreate2Address, keccak256, solidityPack} from "ethers/lib/utils";

const deployWhbar = require('../scripts/deploy-whbar');
const deployHeliSwap = require('../scripts/deploy');
const createHTS = require('../scripts/utilities/create-hts');

const ERC20 = "contracts/core/interfaces/IERC20.sol:IERC20";
const PAIR = "contracts/core/interfaces/IUniswapV2Pair.sol:IUniswapV2Pair";

const computePairAddress = async (t1:string, t2: string, factory: string) : Promise<string> => {
	const getInitCodeHash = require('../scripts/utilities/get-init-code-hash');
	const initCodeHash = await getInitCodeHash();
	return getCreate2Address(
		factory,
		keccak256(solidityPack(['address', 'address'], [t1, t2])),
		initCodeHash);
}

describe('HeliSwap Tests', function () {
	// this.timeout(120_000); // Router + Factory deployment is slow

	let deployer: SignerWithAddress;
	let factory: Contract;
	let router: Contract;
	let whbar: Contract;
	const decimals = 10 ** 8;

	before(async () => {
		// @ts-ignore
		[deployer] = await hardhat.hethers.getSigners();


		// Uncomment for brand new redeployment
		// const whbar = await deployWhbar();
		// const result = await deployHeliSwap(whbar);
		// router = result.router;
		// factory = result.factory;

		// @ts-ignore
		whbar = await hardhat.hethers.getContractAt("WHBAR", '0x0000000000000000000000000000000002bd241a');
		// @ts-ignore
		factory = await hardhat.hethers.getContractAt("UniswapV2Factory", '0x0000000000000000000000000000000002bd247c');
		// @ts-ignore
		router = await hardhat.hethers.getContractAt("UniswapV2Router02", '0x0000000000000000000000000000000002bd2480');
	});

	describe('HTS related tests', function () {

		const TOKEN_A_SUPPLY = 10_000 * decimals; // 10k
		const TOKEN_B_SUPPLY = 100_000 * decimals; // 100k

		let tokenA: Contract;
		let tokenB: Contract;

		before(async () => {
			const tokenAAddress = await createHTS("TokenA", "TA", TOKEN_A_SUPPLY);
			const tokenBAddress = await createHTS("TokenB", "TB", TOKEN_B_SUPPLY);
			// @ts-ignore
			tokenA = await hardhat.hethers.getContractAt(ERC20, tokenAAddress);
			// @ts-ignore
			tokenB = await hardhat.hethers.getContractAt(ERC20, tokenBAddress);
		});

		it('should be able to add HTS/HTS liquidity', async () => {
			const amount0 = 1000 * decimals;
			const amount1 = 5000 * decimals;
			const computedPairAddress = await computePairAddress(tokenA.address, tokenB.address, factory.address);
			await tokenA.approve(router.address, amount0);
			await tokenB.approve(router.address, amount1);
			expect(await router.addLiquidity(
				tokenA.address,
				tokenB.address,
				amount0,
				amount1,
				amount0,
				amount1,
				deployer.address,
				getExpiry()))
				.to.emit(factory, "PairCreated")
				.withArgs(tokenA.address, tokenB.address, computedPairAddress, "TokenA", "TA", "TokenB", "TB");

			const reserves = await router.getReserves(tokenA.address, tokenB.address);
			expect(BigNumber.from(reserves.reserveA).toNumber()).to.be.eq(amount0);
			expect(BigNumber.from(reserves.reserveB).toNumber()).to.be.eq(amount1);
		});

		xit('should be able to remove HTS/HTS liquidity', async () => {
			const amount0 = 2 * decimals;
			const amount1 = 4 * decimals;
			const liquidityAmount = 6 * decimals;
			const computedPairAddress = await computePairAddress(tokenA.address, tokenB.address, factory.address);
			// @ts-ignore
			const pairContract = await hardhat.hethers.getContractAt(PAIR, computedPairAddress);
			const supply = BigNumber.from(await pairContract.totalSupply()).toNumber();
			const removableLiquidity = (supply/100).toString().split(".")[0];
			await pairContract.approve(router.address, 1000 * decimals);

			expect(await router.removeLiquidity(
				tokenA.address,
				tokenB.address,
				removableLiquidity,
				amount0,
				amount1,
				deployer.address,
				getExpiry()
			)).to.emit(pairContract, "Burn").withArgs(deployer.address, amount0, amount0, liquidityAmount)
				.to.emit(pairContract, "Sync")
		})

		xit('should be able to swap HTS/HTS', async () => {
			const amount0 = 200 * decimals;
			const amount1 = 600 * decimals;
			await tokenA.approve(router.address, amount0);
			await tokenB.approve(router.address, amount1);
			const computedPairAddress = await computePairAddress(tokenA.address, tokenB.address, factory.address);
			// @ts-ignore
			const pairContract = await hardhat.hethers.getContractAt(PAIR, computedPairAddress);
			// @ts-ignore
			expect(await router.swapExactTokensForTokens(
				amount0,
				amount1,
				[tokenA.address, tokenB.address],
				deployer.address,
				getExpiry())).to.emit(pairContract, "Swap").withArgs(amount0, amount1, deployer.address);
		})

		it('should be able to add HTS/HBAR liquidity', async () => {
			const whbarDecimals = (10 ** await whbar.decimals());
			const amountHts  = 1000 * decimals;
			const amountHbar = 100;
			await whbar.deposit({value: amountHbar})
			await tokenA.approve(router.address, amountHts);
			await whbar.approve(router.address, amountHbar * whbarDecimals);
			const computedPairAddress = await computePairAddress(tokenA.address, whbar.address, factory.address);
			expect(await router.addLiquidityETH(
				tokenA.address,
				amountHts,
				amountHts,
				amountHbar,
				deployer.address,
				getExpiry(), {value: amountHbar})).to.emit(factory, "PairCreated")
				.withArgs(tokenA.address, whbar.address, computedPairAddress, "TokenA", "TA", "WHBAR", "HBAR");
		})

		xit('should be able to remove HTS/HBAR liquidity', async () => {
			const whbarDecimals = (10 ** await whbar.decimals());
			const amountHts  = 500 * decimals;
			const amountHbar = 40;
			const liquidity = 10 * decimals;
			await tokenA.approve(router.address, amountHts);
			await whbar.approve(router.address, amountHbar * whbarDecimals);
			// @ts-ignore
			const pairContract = await hardhat.hethers.getContractAt(PAIR, await computePairAddress(tokenA.address, whbar.address, factory.address));
			expect(await router.removeLiquidityETH(
				tokenA.address,
				liquidity,
				amountHts,
				amountHbar,
				deployer.address,
				getExpiry()
			)).to.emit(pairContract, "Burn").withArgs(deployer.address, liquidity, amountHbar)
		})

		it('should be able to swap HTS/HBAR', async () => {

		})

		it('should revert if associate fails with != 22 || 167 error code', async () => {

		})

	})
});

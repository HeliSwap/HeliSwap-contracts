import hardhat from "hardhat";
import {SignerWithAddress} from "hardhat-hethers/internal/signers";
import * as hethers from "@hashgraph/hethers";
import {BigNumber, Contract} from "@hashgraph/hethers";
import {Utils} from "../utils/utils";
import {expect} from "chai";

import getExpiry = Utils.getExpiry;
import expectTx from "../utils/LogAssertion";

const createHTS = require('../scripts/utilities/create-hts');
const deployHeliSwap = require('../scripts/deploy');
const deployMintERC20 = require('../scripts/utilities/deploy-mint-erc20');

const ERC20 = "contracts/core/interfaces/IERC20.sol:IERC20";

const TOKEN_A_NAME = "TokenA";
const TOKEN_A_SYMBOL = "TA";
const TOKEN_B_NAME = "TokenB";
const TOKEN_B_SYMBOL = "TB";
const ERC20_NAME = "erc20Token";
const ERC20_SYMBOL = "ERC"
const ERC20_DECIMALS = 18;
const HTS_DECIMALS = 8;

describe('HeliSwap Tests', function () {
	this.timeout(120_000); // Router + Factory deployment is slow

	let deployer: SignerWithAddress;
	let factory: Contract;
	let router: Contract;
	let whbar: Contract;
	const decimals = 10 ** HTS_DECIMALS;

	before(async () => {
		// @ts-ignore
		[deployer] = await hardhat.hethers.getSigners();

		// @ts-ignore
		const WHBAR = await hardhat.hethers.getContractFactory('MockWHBAR');
		whbar = await WHBAR.deploy();
		await whbar.deployed();

		// @ts-ignore
		const result = await deployHeliSwap(hethers.utils.getAddress(whbar.address));
		router = result.router;
		factory = result.factory;

		// @ts-ignore
		factory = await hardhat.hethers.getContractAt("UniswapV2Factory", factory.address);
		// @ts-ignore
		router = await hardhat.hethers.getContractAt("UniswapV2Router02", router.address);
	});

	describe('Adding HTS liquidity', function () {
		const TOKEN_A_SUPPLY = 10_000 * decimals; // 10k
		let tokenA: Contract;

		beforeEach(async () => {
			const newTokenA = await createHTS("TokenA", "TA", TOKEN_A_SUPPLY);
			// @ts-ignore
			tokenA = await hardhat.hethers.getContractAt(ERC20, newTokenA.tokenAddress);
		});

		it('should be able to add HTS/HTS liquidity', async () => {
			const TOKEN_B_SUPPLY = 100_000 * decimals; // 100k
			const newTokenB = await createHTS("TokenB", "TB", TOKEN_B_SUPPLY);
			// @ts-ignore
			const tokenB = await hardhat.hethers.getContractAt(ERC20, newTokenB.tokenAddress);
			const amount0 = BigNumber.from(1_000 * decimals);
			const amount1 = BigNumber.from(5_000 * decimals);

			await executeAddLiquidity(
				tokenA,
				tokenB,
				amount0,
				amount1,
				TOKEN_A_SYMBOL,
				TOKEN_B_SYMBOL,
				TOKEN_A_NAME,
				TOKEN_B_NAME,
				BigNumber.from(HTS_DECIMALS),
				BigNumber.from(HTS_DECIMALS)
			);
		});

		it('should be able to add HTS/HBAR liquidity', async () => {
			const htsAmount = BigNumber.from(10 * decimals);
			await executeAddLiquidityHBAR(
				tokenA,
				htsAmount,
				BigNumber.from(1),
				TOKEN_A_NAME,
				TOKEN_A_SYMBOL,
				BigNumber.from(HTS_DECIMALS)
			);
		});

		it('should be able to add HTS/ERC20 liquidity', async () => {
			const amountHts = BigNumber.from(10 * decimals);
			const amountERC20 = hethers.utils.parseUnits("100", ERC20_DECIMALS);
			const erc20Address = await deployMintERC20(deployer.address, amountERC20, ERC20_NAME, ERC20_SYMBOL)
			// @ts-ignore
			const erc20 = await hardhat.hethers.getContractAt(ERC20, erc20Address);
			await approveRouter(tokenA, erc20, amountHts, amountERC20);

			await executeAddLiquidity(
				tokenA,
				erc20,
				amountHts,
				amountERC20,
				TOKEN_A_SYMBOL,
				ERC20_SYMBOL,
				TOKEN_A_NAME,
				ERC20_NAME,
				BigNumber.from(HTS_DECIMALS),
				BigNumber.from(ERC20_DECIMALS)
			);
		});

	})

	describe('Adding ERC20 liquidity', async () => {
		const ERC20_SUPPLY = hethers.utils.parseUnits("100", ERC20_DECIMALS);
		let erc20: Contract;

		beforeEach(async () => {
			const erc20Address = await deployMintERC20(deployer.address, ERC20_SUPPLY, ERC20_NAME, ERC20_SYMBOL)
			// @ts-ignore
			erc20 = await hardhat.hethers.getContractAt(ERC20, erc20Address);
		});

		it('should be able to add ERC20/ERC20 liquidity', async () => {
			const amount0 = hethers.utils.parseUnits("1", ERC20_DECIMALS);
			const amount1 = hethers.utils.parseUnits("10", ERC20_DECIMALS);
			const otherERC20Name = "ERC20 Token Other";
			const otherERC20Symbol = "ERC20Other";
			const otherERC20Address = await deployMintERC20(deployer.address, ERC20_SUPPLY, otherERC20Name, otherERC20Symbol);
			// @ts-ignore
			const otherERC20 = await hardhat.hethers.getContractAt(ERC20, otherERC20Address);
			await approveRouter(erc20, otherERC20, amount0, amount1);

			await executeAddLiquidity(
				erc20,
				otherERC20,
				amount0,
				amount1,
				ERC20_SYMBOL,
				otherERC20Symbol,
				ERC20_NAME,
				otherERC20Name,
				BigNumber.from(ERC20_DECIMALS),
				BigNumber.from(ERC20_DECIMALS)
			);
		});

		it('should be able to add ERC20/HBAR liquidity', async () => {
			const amount1Hbar = BigNumber.from(1);
			const amount0 = hethers.utils.parseUnits("10", ERC20_DECIMALS);

			await executeAddLiquidityHBAR(
				erc20,
				amount0,
				amount1Hbar,
				ERC20_NAME,
				ERC20_SYMBOL,
				BigNumber.from(ERC20_DECIMALS)
			);
		});
	});

	async function executeAddLiquidityHBAR(
		token0: Contract,
		amount0: BigNumber,
		amount1Hbar: BigNumber,
		token0Name: string,
		token0Symbol: string,
		token0Decimals: BigNumber) {

		const amount1Tinybar = amount1Hbar.mul(decimals);
		await token0.approve(router.address, amount0);
		await whbar.approve(router.address, amount1Tinybar);

		let addLiquidityETHTx = await router.addLiquidityETH(
			token0.address,
			amount0,
			amount0,
			amount1Tinybar,
			deployer.address,
			getExpiry(),
			{value:  amount1Hbar}
		);
		addLiquidityETHTx = await addLiquidityETHTx.wait();
		const pairAddress = await Utils.computePairAddress(whbar.address, token0.address, factory.address);

		expectTx(addLiquidityETHTx).toEmitted(factory, "PairCreated").withArgs(
			hethers.utils.getAddress(whbar.address),
			hethers.utils.getAddress(token0.address),
			hethers.utils.getAddress(pairAddress),
			undefined,
			"WHBAR",
			token0Symbol,
			"Wrapped Hbar",
			token0Name,
			BigNumber.from(HTS_DECIMALS),
			BigNumber.from(token0Decimals)
		);
		await assertReserves(whbar, token0, amount1Tinybar, amount0, pairAddress);
	}

	async function executeAddLiquidity(
		token0: Contract,
		token1: Contract,
		amount0: BigNumber,
		amount1: BigNumber,
		token0Symbol: string,
		token1Symbol: string,
		token0Name: string,
		token1Name: string,
		token0Decimals: BigNumber,
		token1Decimals: BigNumber) {

		await token0.approve(router.address, amount0);
		await token1.approve(router.address, amount1);

		let addLiquidityTx = await router.addLiquidity(
			token0.address,
			token1.address,
			amount0,
			amount1,
			amount0,
			amount1,
			deployer.address,
			getExpiry());
		addLiquidityTx = await addLiquidityTx.wait();
		const pairAddress = await Utils.computePairAddress(token0.address, token1.address, factory.address);
		expectTx(addLiquidityTx).toEmitted(factory, "PairCreated").withArgs(
			hethers.utils.getAddress(token0.address),
			hethers.utils.getAddress(token1.address),
			hethers.utils.getAddress(pairAddress),
			undefined,
			token0Symbol,
			token1Symbol,
			token0Name,
			token1Name,
			token0Decimals,
			token1Decimals
		);
		await assertReserves(token0, token1, amount0, amount1, pairAddress);
	}

	async function approveRouter(tokenA: Contract, tokenB: any, amount0: BigNumber, amount1: BigNumber) {
		await tokenA.approve(router.address, amount0);
		await tokenB.approve(router.address, amount1);
	}

	async function assertReserves(tokenA: Contract, tokenB: Contract, token0: BigNumber, token1: BigNumber, pairAddress: string) {
		const reserves = await router.getReserves(tokenA.address, tokenB.address);
		expect(reserves.reserveA).to.equal(token0);
		expect(reserves.reserveB).to.equal(token1);

		const pairBalance0 = await tokenA.balanceOf(pairAddress);
		const pairBalance1 = await tokenB.balanceOf(pairAddress);
		expect(pairBalance0).to.equal(token0);
		expect(pairBalance1).to.equal(token1);
	}
});


// it('should be able to remove HTS/HTS liquidity', async () => {
// 	// @ts-ignore
// 	const pairContract = await hardhat.hethers.getContractAt(PAIR, HTSComputedPairAddress);
// 	const supply = hethers.BigNumber.from(await pairContract.totalSupply()).toNumber();
// 	const removableLiquidity = (supply / 100).toString().split(".")[0];
// 	await pairContract.approve(router.address, 1000 * decimals);
//
// 	const removeAmount0 = 2 * decimals;
// 	const removeAmount1 = 4 * decimals;
//
// 	let removeLiquidityTX = await router.removeLiquidity(
// 		tokenA.address,
// 		tokenB.address,
// 		removableLiquidity,
// 		removeAmount0,
// 		removeAmount1,
// 		deployer.address,
// 		getExpiry()
// 	)
//
// 	removeLiquidityTX = await removeLiquidityTX.wait()
//
// 	// FIXME: check the log field values and assert properly
// 	findLogAndAssert(removeLiquidityTX.logs, burnEventABI,
// 		{
// 			to: hethers.utils.getAddress(deployer.address)
// 		}
// 	)
//
// 	findLogAndAssert(removeLiquidityTX.logs, syncEventABI,
// 		{
// 			reserve0: "99000000001",
// 			reserve1: "495000000002",
// 			totalSupply: "221370729772"
// 		}
// 	)
// })

// it('should be able to swap HTS/HTS', async () => {
// 	const amount0 = 200 * decimals;
// 	const amount1 = 600 * decimals;
// 	await tokenA.approve(router.address, amount0);
// 	await tokenB.approve(router.address, amount1);
//
// 	// @ts-ignore
// 	const pairContract = await hardhat.hethers.getContractAt(PAIR, HTSComputedPairAddress);
//
// 	let swapTx = await router.swapExactTokensForTokens(
// 		amount0,
// 		amount1,
// 		[tokenA.address, tokenB.address],
// 		deployer.address,
// 		getExpiry())
//
// 	swapTx = await swapTx.wait()
//
// 	findLogAndAssert(swapTx.logs, swapEventABI,
// 		{
// 			to: hethers.utils.getAddress(deployer.address),
// 			amount0In: amount0,
// 			amount1Out: "82985538926"
// 		}
// 	)
// })


//
// // FIXME: This case is currently failing and being investigated... Will be resolved soon.
// xit('should be able to remove HTS/HBAR liquidity', async () => {
// 	// await new Promise(async (resolve, reject) => {setTimeout(resolve, 10000)});
// 	const whbarDecimals = (10 ** await whbar.decimals());
// 	const amountHts = decimals;
// 	const amountHbar = 5;
// 	const pairAddress = await factory.getPair(tokenA.address, whbar.address);
//
// 	// @ts-ignore
// 	const pairContract = await hardhat.hethers.getContractAt(PAIR, pairAddress);
// 	const supply = hethers.BigNumber.from(await pairContract.totalSupply()).toNumber();
// 	const removableLiquidity = (supply / 10).toString().split(".")[0];
// 	await pairContract.approve(router.address, removableLiquidity + 1);
//
// 	console.log(`Will remove ${removableLiquidity} HTS/HBAR liquidity`);
// 	await tokenA.approve(router.address, amountHts + 1);
// 	await whbar.approve(router.address, amountHbar * whbarDecimals + 1);
//
// 	await router.optimisticAssociation(tokenA.address);
//
// 	let removeLiquidityETHTx = await router.removeLiquidityETH(
// 		tokenA.address,
// 		removableLiquidity,
// 		amountHts,
// 		amountHbar,
// 		deployer.address,
// 		getExpiry()
// 	)
//
// 	removeLiquidityETHTx = await removeLiquidityETHTx.wait()
//
// 	findLogAndAssert(removeLiquidityETHTx.logs, burnEventABI, {
// 		to: hethers.utils.getAddress(deployer.address)
// 	})
// })

// it('should be able to swap HTS/HBAR', async () => {
// 	const amount0 = 100 * decimals;
// 	const amountHbar = 4;
// 	await tokenA.approve(router.address, amount0);
// 	await whbar.approve(router.address, amountHbar * decimals);
//
// 	// @ts-ignore
// 	const pairContract = await hardhat.hethers.getContractAt(PAIR, MixedComputedPairAddress);
//
// 	let swapExactTokensForETHTx = await router.swapExactTokensForETH(
// 		amount0,
// 		amountHbar,
// 		[tokenA.address, whbar.address],
// 		deployer.address,
// 		getExpiry());
//
// 	swapExactTokensForETHTx = await swapExactTokensForETHTx.wait();
//
// 	// FIXME: Logs addresses of aliased contracts are again being exported with their mirror node 0xlongzeroaddresses instead of the EVM create2 addresses
// 	findLogAndAssert(swapExactTokensForETHTx.logs, transferEventABI, {
// 		from: hethers.utils.getAddress(deployer.address),
// 		// to: MixedComputedPairAddress,
// 		value: "10000000000",
// 	})
//
// 	findLogAndAssert(swapExactTokensForETHTx.logs, swapEventABI, {
// 		sender: hethers.utils.getAddress(router.address),
// 		to: hethers.utils.getAddress(router.address),
// 		amount0In: "0",
// 		amount1In: "10000000000",
// 		amount0Out: "4544211485",
// 		amount1Out: "0",
// 	})
// })
//
// it('should revert if associate fails with != 22 || 167 error code', async () => {
// 	await expect(factory.createPair(tokenA.address, deployer.address)).to.be.reverted;
// 	await expect(factory.createPair(deployer.address, tokenA.address)).to.be.reverted;
// })

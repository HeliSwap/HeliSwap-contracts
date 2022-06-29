import hardhat from "hardhat";
import {SignerWithAddress} from "hardhat-hethers/internal/signers";
import * as hethers from "@hashgraph/hethers";
import {BigNumber, Contract} from "@hashgraph/hethers";
import {Utils} from "../utils/utils";
import {expect} from "chai";
import expectTx from "../utils/LogAssertion";
import getExpiry = Utils.getExpiry;

const createHTS = require('../scripts/utilities/create-hts');
const deployHeliSwap = require('../scripts/deploy');
const deployMintERC20 = require('../scripts/utilities/deploy-mint-erc20');

const ERC20 = "contracts/core/interfaces/IERC20.sol:IERC20";
const PAIR = "contracts/core/interfaces/IUniswapV2Pair.sol:IUniswapV2Pair";

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

	describe('', async () => {
		const TOKEN_A_SUPPLY = 10_000 * decimals; // 10k
		let tokenA: Contract;

		beforeEach(async () => {
			const newTokenA = await createHTS("TokenA", "TA", TOKEN_A_SUPPLY);
			// @ts-ignore
			tokenA = await hardhat.hethers.getContractAt(ERC20, newTokenA.tokenAddress);
		});

		describe('Adding HTS liquidity', function () {

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

		describe('HTS related swaps', async () => {

			it('should be able to swap HTS/HTS', async () => {
				// Given
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

				// When

				// Then

			});

			it('should be able to swap HTS/HBAR', async () => {

			});

			it('should be able to swap HTS/ERC20', async () => {

			});
		})
	});

	describe('', async () => {

		const ERC20_SUPPLY = hethers.utils.parseUnits("100", ERC20_DECIMALS);
		let erc20: Contract;

		beforeEach(async () => {
			const erc20Address = await deployMintERC20(deployer.address, ERC20_SUPPLY, ERC20_NAME, ERC20_SYMBOL)
			// @ts-ignore
			erc20 = await hardhat.hethers.getContractAt(ERC20, erc20Address);
		});

		describe('Adding ERC20 liquidity', async () => {

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

		describe('ERC20 related swaps', async () => {


			it('should be able to swap ERC20/HBAR', async () => {

			});

			it('should be able to swap ERC20/ERC20', async () => {

			});

		});

	});

	describe('Removing HTS liquidity', function () {
		const TOKEN_A_SUPPLY = 10_000 * decimals; // 10k
		let tokenA: Contract;

		beforeEach(async () => {
			const newTokenA = await createHTS("TokenA", "TA", TOKEN_A_SUPPLY);
			// @ts-ignore
			tokenA = await hardhat.hethers.getContractAt(ERC20, newTokenA.tokenAddress);
		});

		it('should be able to remove HTS/HTS liquidity', async () => {
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

			const removeAmount0 = BigNumber.from(2 * decimals);
			const removeAmount1 = BigNumber.from(4 * decimals);

			// @ts-ignore
			const pairContractAddress = Utils.getCreate2Address(factory.address, [tokenA.address, tokenB.address]);
			// @ts-ignore
			const pairContract = await hardhat.hethers.getContractAt(PAIR, pairContractAddress);

			const supply = hethers.BigNumber.from(await pairContract.totalSupply()).toNumber();
			const removableLiquidity = hethers.BigNumber.from((supply / 100).toString().split(".")[0]);

			await pairContract.approve(router.address, 1000 * decimals);

			await executeRemoveLiquidity(tokenA, tokenB, removeAmount0, removeAmount1, removableLiquidity, pairContract, deployer.address);
		});

	})

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
		const pairAddress = Utils.getCreate2Address(factory.address, [whbar.address, token0.address]);

		(await expectTx(
			router.addLiquidityETH(
				token0.address,
				amount0,
				amount0,
				amount1Tinybar,
				deployer.address,
				getExpiry(),
				{value: amount1Hbar}
			)
		)).toEmitted(factory, "PairCreated").withArgs(
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
		const pairAddress = Utils.getCreate2Address(factory.address, [token0.address, token1.address]);

		(await expectTx(
				router.addLiquidity(
					token0.address,
					token1.address,
					amount0,
					amount1,
					amount0,
					amount1,
					deployer.address,
					getExpiry()))
		)
			.toEmitted(factory, "PairCreated")
			.withArgs(
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

	async function executeRemoveLiquidity(
		token0: Contract,
		token1: Contract,
		amount0: BigNumber,
		amount1: BigNumber,
		removableLiquidity: BigNumber,
		pairContract: Contract,
		to: any) {
		// TODO: Remove hardcoded values
		(await expectTx(
			router.removeLiquidity(
				token0.address,
				token1.address,
				removableLiquidity,
				amount0,
				amount1,
				to,
				getExpiry())
		)).toEmitted(pairContract, "Burn")
			.withArgs(
				hethers.utils.getAddress(router.address),
				"999999999",
				"4999999998",
				hethers.utils.getAddress(deployer.address),
				"2236067977")
			.toEmitted(pairContract, "Sync")
			.withArgs("99000000001", "495000000002", "221370729772")
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
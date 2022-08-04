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
		const result = await deployHeliSwap(
			hethers.utils.getAddress(whbar.address),
			hethers.utils.getAddress(deployer.address)
		);
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
				let reservesIn = amount0
				let reservesOut = amount1
				let amountIn = amount0.div("2"); // get half of LP
				let amountOut = await getAmountOut(amountIn, reservesIn, reservesOut);

				await executeSwap(tokenA, tokenB, amountIn, amountOut, deployer.address);
			});

			it('should be able to swap HTS/HBAR', async () => {
				const htsAmount = BigNumber.from(10 * decimals);
				const hbarAmount = BigNumber.from(1);
				await executeAddLiquidityHBAR(
					tokenA,
					htsAmount,
					hbarAmount,
					TOKEN_A_NAME,
					TOKEN_A_SYMBOL,
					BigNumber.from(HTS_DECIMALS)
				);

				// When
				let reservesIn = htsAmount
				let reservesOut = hbarAmount.mul(decimals)
				let amountIn = htsAmount.div("2"); // get half of LP
				let amountOut = await getAmountOut(amountIn, reservesIn, reservesOut);

				await executeSwapHBAR(tokenA, amountIn, amountOut, deployer.address);
			});

			it('should be able to swap HTS/ERC20', async () => {
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

				// When
				let reservesIn = amountHts
				let reservesOut = amountERC20
				let amountIn = amountHts.div("2"); // get half of LP
				let amountOut = await getAmountOut(amountIn, reservesIn, reservesOut);

				await executeSwap(tokenA, erc20, amountIn, amountOut, deployer.address);
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

			beforeEach(async () => {
				const erc20Address = await deployMintERC20(deployer.address, ERC20_SUPPLY, ERC20_NAME, ERC20_SYMBOL)
				// @ts-ignore
				erc20 = await hardhat.hethers.getContractAt(ERC20, erc20Address);
			});

			it('should be able to swap ERC20/HBAR', async () => {
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

				// When
				let reservesIn = amount0
				let reservesOut = amount1Hbar.mul(decimals)
				let amountIn = reservesIn.div("2"); // get half of LP
				let amountOut = await getAmountOut(amountIn, reservesIn, reservesOut);

				await executeSwapHBAR(
					erc20,
					amountIn,
					amountOut,
					deployer.address
				);
			});

			it('should be able to swap ERC20/ERC20', async () => {
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

				// When
				let reservesIn = amount0
				let reservesOut = amount1
				let amountIn = reservesIn.div("2"); // get half of LP
				let amountOut = await getAmountOut(amountIn, reservesIn, reservesOut);

				await executeSwap(
					erc20,
					otherERC20,
					amountIn,
					amountOut,
					deployer.address
				);
			});

		});

		describe('ERC20 related removals', async () => {

			beforeEach(async () => {
				const erc20Address = await deployMintERC20(deployer.address, ERC20_SUPPLY, ERC20_NAME, ERC20_SYMBOL)
				// @ts-ignore
				erc20 = await hardhat.hethers.getContractAt(ERC20, erc20Address);
			});

			it('should be able to remove ERC20/HBAR liquidity', async () => {
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

				// @ts-ignore
				const pairContractAddress = Utils.getCreate2Address(factory.address, [erc20.address, whbar.address]);
				// @ts-ignore
				const pairContract = await hardhat.hethers.getContractAt(PAIR, pairContractAddress);

				const balanceTokenA = BigNumber.from(amount0);
				const balanceTokenB = BigNumber.from(amount1Hbar.mul(decimals));
				const supply = BigNumber.from(await pairContract.totalSupply());

				const removableLPAmount = supply.div("2");

				const amountAOut = removableLPAmount.mul(balanceTokenA).div(supply);
				const amountBOut = removableLPAmount.mul(balanceTokenB).div(supply);

				await pairContract.approve(router.address, hethers.constants.MaxUint256);

				await executeRemoveLiquidityHBAR(erc20, removableLPAmount, amountAOut, amountBOut, deployer.address, pairContract);
			});

			it('should be able to remove ERC20/ERC20 liquidity', async () => {
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

				// @ts-ignore
				const pairContractAddress = Utils.getCreate2Address(factory.address, [erc20.address, otherERC20.address]);
				// @ts-ignore
				const pairContract = await hardhat.hethers.getContractAt(PAIR, pairContractAddress);

				const balanceTokenA = BigNumber.from(amount0);
				const balanceTokenB = BigNumber.from(amount1);
				const supply = BigNumber.from(await pairContract.totalSupply());

				const removableLPAmount = supply.div("2");

				const amountAOut = removableLPAmount.mul(balanceTokenA).div(supply);
				const amountBOut = removableLPAmount.mul(balanceTokenB).div(supply);

				await pairContract.approve(router.address, hethers.constants.MaxUint256);

				await executeRemoveLiquidity(erc20, otherERC20, removableLPAmount, amountAOut, amountBOut, pairContract, deployer.address);
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

			// @ts-ignore
			const pairContractAddress = Utils.getCreate2Address(factory.address, [tokenA.address, tokenB.address]);
			// @ts-ignore
			const pairContract = await hardhat.hethers.getContractAt(PAIR, pairContractAddress);

			const balanceTokenA = BigNumber.from(amount0);
			const balanceTokenB = BigNumber.from(amount1);
			const supply = BigNumber.from(await pairContract.totalSupply());

			const removableLPAmount = supply.div("2");

			const amountAOut = removableLPAmount.mul(balanceTokenA).div(supply);
			const amountBOut = removableLPAmount.mul(balanceTokenB).div(supply);

			await pairContract.approve(router.address, hethers.constants.MaxUint256);

			await executeRemoveLiquidity(tokenA, tokenB, removableLPAmount, amountAOut, amountBOut, pairContract, deployer.address);
		});

		it('should be able to remove HTS/ERC20 liquidity', async () => {
			const amountHts = BigNumber.from(1_000 * decimals);
			const amountERC20 = hethers.utils.parseUnits("5000", ERC20_DECIMALS);
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

			// @ts-ignore
			const pairContractAddress = Utils.getCreate2Address(factory.address, [tokenA.address, erc20.address]);
			// @ts-ignore
			const pairContract = await hardhat.hethers.getContractAt(PAIR, pairContractAddress);

			const balanceTokenA = BigNumber.from(amountHts);
			const balanceTokenB = BigNumber.from(amountERC20);
			const supply = BigNumber.from(await pairContract.totalSupply());

			const removableLPAmount = supply.div("2");

			const amountAOut = removableLPAmount.mul(balanceTokenA).div(supply);
			const amountBOut = removableLPAmount.mul(balanceTokenB).div(supply);

			await pairContract.approve(router.address, hethers.constants.MaxUint256);

			await executeRemoveLiquidity(
				tokenA,
				erc20,
				removableLPAmount,
				amountAOut,
				amountBOut,
				pairContract,
				deployer.address);
		});

		it('should be able to remove HTS/HBAR liquidity', async () => {
			const htsAmount = BigNumber.from(10 * decimals);
			const hbarAmount = BigNumber.from(50);
			await executeAddLiquidityHBAR(
				tokenA,
				htsAmount,
				hbarAmount,
				TOKEN_A_NAME,
				TOKEN_A_SYMBOL,
				BigNumber.from(HTS_DECIMALS)
			);

			// @ts-ignore
			const pairContractAddress = Utils.getCreate2Address(factory.address, [tokenA.address, whbar.address]);
			// @ts-ignore
			const pairContract = await hardhat.hethers.getContractAt(PAIR, pairContractAddress);

			const balanceTokenA = BigNumber.from(htsAmount);
			const balanceTokenB = BigNumber.from(hbarAmount.mul(decimals));
			const supply = BigNumber.from(await pairContract.totalSupply());

			const removableLPAmount = supply.div("2");

			const amountAOut = removableLPAmount.mul(balanceTokenA).div(supply);
			const amountBOut = removableLPAmount.mul(balanceTokenB).div(supply);

			await pairContract.approve(router.address, hethers.constants.MaxUint256);

			await executeRemoveLiquidityHBAR(tokenA, removableLPAmount, amountAOut, amountBOut, deployer.address, pairContract);
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
			router.addLiquidityHBAR(
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

	async function executeSwap(
		token0: Contract,
		token1: Contract,
		amount0: BigNumber,
		amount1: BigNumber,
		to: String) {

		await token0.approve(router.address, amount0);
		await token1.approve(router.address, amount1);

		const pairAddress = Utils.getCreate2Address(factory.address, [token0.address, token1.address]);
		// @ts-ignore
		let pairContract = await hardhat.hethers.getContractAt("UniswapV2Pair", pairAddress)

		const reservesBeforeSwap = await router.getReserves(token0.address, token1.address);

		await (await expectTx(
				router.swapExactTokensForTokens(
					amount0,
					amount1,
					[token0.address, token1.address],
					to,
					getExpiry()))
		)
		.toEmitted(pairContract, "Swap")
		.withArgs(
			hethers.utils.getAddress(router.address),
			amount0,
			BigNumber.from("0"),
			BigNumber.from("0"),
			amount1,
			hethers.utils.getAddress(deployer.address),
		);

		await assertReserves(
			token0,
			token1,
			reservesBeforeSwap.reserveA.add(amount0),
			reservesBeforeSwap.reserveB.sub(amount1),
			pairAddress
		);
	}

	async function executeSwapHBAR(
		token: Contract,
		amount0: BigNumber,
		amount1: BigNumber,
		to: String) {

		await token.approve(router.address, amount0);
		await whbar.approve(router.address, amount1);

		const pairAddress = Utils.getCreate2Address(factory.address, [token.address, whbar.address]);
		// @ts-ignore
		let pairContract = await hardhat.hethers.getContractAt("UniswapV2Pair", pairAddress)

		const reservesBeforeSwap = await router.getReserves(token.address, whbar.address);

		await (await expectTx(
				router.swapExactTokensForHBAR(
					amount0,
					amount1,
					[token.address, whbar.address],
					to,
					getExpiry()))
		)
		.toEmitted(pairContract, "Swap")
		.withArgs(
			hethers.utils.getAddress(router.address),
			BigNumber.from("0"),
			amount0,
			amount1,
			BigNumber.from("0"),
			hethers.utils.getAddress(router.address),
		);

		await assertReserves(
			token,
			whbar,
			reservesBeforeSwap.reserveA.add(amount0),
			reservesBeforeSwap.reserveB.sub(amount1),
			pairAddress
		);
	}

	async function executeRemoveLiquidity(
		token0: Contract,
		token1: Contract,
		removableLiquidity: BigNumber,
		amount0: BigNumber,
		amount1: BigNumber,
		pairContract: Contract,
		to: any) {

		const reservesBeforeRemoveLP = await router.getReserves(token0.address, token1.address);
		const totalSupplyBeforeRemoveLP = BigNumber.from(await pairContract.totalSupply());

		(await expectTx(
			router.removeLiquidity(
				token0.address,
				token1.address,
				removableLiquidity,
				amount0,
				amount1,
				to,
				getExpiry())
		))
			.toEmitted(pairContract, "Burn")
			.withArgs(
				hethers.utils.getAddress(router.address),
				amount0,
				amount1,
				hethers.utils.getAddress(deployer.address),
				removableLiquidity)

			.toEmitted(pairContract, "Sync")
			.withArgs(
				reservesBeforeRemoveLP.reserveA.sub(amount0),
				reservesBeforeRemoveLP.reserveB.sub(amount1),
				totalSupplyBeforeRemoveLP.sub(removableLiquidity)
			)
	}

	async function executeRemoveLiquidityHBAR(
		token0: Contract,
		lpAmount: BigNumber,
		amount: BigNumber,
		amountTinybars: BigNumber,
		to: any,
		pairContract: Contract) {

		const reservesBeforeRemoveLP = await router.getReserves(token0.address, whbar.address);
		const totalSupplyBeforeRemoveLP = BigNumber.from(await pairContract.totalSupply());

		(await expectTx(router.removeLiquidityHBAR(
			token0.address,
			lpAmount,
			amount,
			amountTinybars,
			to,
			getExpiry())
		))
		.toEmitted(pairContract, "Burn")
		.withArgs(
			hethers.utils.getAddress(router.address),
			amountTinybars,
			amount,
			hethers.utils.getAddress(router.address),
			lpAmount)

		.toEmitted(pairContract, "Sync")
		.withArgs(
			reservesBeforeRemoveLP.reserveB.sub(amountTinybars),
			reservesBeforeRemoveLP.reserveA.sub(amount),
			totalSupplyBeforeRemoveLP.sub(lpAmount)
		)
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

	async function getAmountOut(amountIn: BigNumber, reserveIn: BigNumber, reserveOut: BigNumber) {
		let amountInWithFee = amountIn.mul("997")
		let numerator = amountInWithFee.mul(reserveOut)
		let denominator = reserveIn.mul(1000).add(amountInWithFee)

		return numerator.div(denominator);
	}
});

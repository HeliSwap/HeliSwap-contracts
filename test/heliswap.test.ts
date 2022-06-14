import hardhat from "hardhat";
import {SignerWithAddress} from "hardhat-hethers/internal/signers";
import {BigNumber, Contract} from "@hashgraph/hethers";
import {Utils} from "../utils/utils";
import getExpiry = Utils.getExpiry;
import * as util from "util";

const deployWhbar = require('../scripts/deploy-whbar');
const deployHeliSwap = require('../scripts/deploy');
const createHTS = require('../scripts/utilities/create-hts');

const ERC20 = "contracts/core/interfaces/IERC20.sol:IERC20";
const PAIR = "contracts/core/interfaces/IUniswapV2Pair.sol:IUniswapV2Pair";
describe('HeliSwap Tests', function () {
	// this.timeout(120_000); // Router + Factory deployment is slow

	let deployer: SignerWithAddress;
	let factory: Contract;
	let router: Contract;
	let whbar: Contract;

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

		const TOKEN_A_SUPPLY = 10_000 * (10 ** 8); // 10k
		const TOKEN_B_SUPPLY = 100_000 * (10 ** 8); // 100k

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
			const amount0 = 1000 * (10 ** 8);
			const amount1 = 5000 * (10 ** 8);

			await tokenA.approve(router.address, amount0);
			await tokenB.approve(router.address, amount1);

			const tx = await router.addLiquidity(
				tokenA.address,
				tokenB.address,
				amount0,
				amount1,
				amount0,
				amount1,
				deployer.address,
				getExpiry());
			const receipt = await tx.wait();
			console.log(util.inspect(receipt, {depth: null}));
		});

		it('should be able to remove HTS/HTS liquidity', async () => {
			const amount0 = 2 * ( 10 ** 8 );
			const amount1 = 4 * ( 10 ** 8 );
			const liquidityAmount = 6 * ( 10 ** 8 );
			const pairAddr = await factory.getPair(tokenA.address, tokenB.address);
			console.log(`Got pair ${pairAddr}`);
			// @ts-ignore
			const pairContract = await hardhat.hethers.getContractAt("contracts/core/interfaces/IUniswapV2Pair.sol:IUniswapV2Pair", pairAddr); // invalid address - throws the abi
			const supply = BigNumber.from(await pairContract.totalSupply()).toNumber();
			console.log(`Pair supply ${supply}`);
			const removableLiquidity = (supply/100).toString().split(".")[0];
			await pairContract.approve(router.address, 1000 * (10 ** 8));

			const tx = await router.removeLiquidity(
				tokenA.address,
				tokenB.address,
				removableLiquidity,
				amount0,
				amount0,
				deployer.address,
				getExpiry()
			);
		})

		it('should be able to swap HTS/HTS', async () => {
			const amount0 = 200 * ( 10 ** 8 );
			const amount1 = 600 * ( 10 ** 8 );
			await tokenA.approve(router.address, amount0);
			await tokenB.approve(router.address, amount1);

			// @ts-ignore
			const swapTx = await router.swapExactTokensForTokens(
				amount0,
				amount1,
				[tokenA.address, tokenB.address],
				deployer.address,
				getExpiry());
			const txReceipt = await swapTx.wait();
			console.log(txReceipt);
		})

		it('should be able to add HTS/HBAR liquidity', async () => {

		})

		it('should be able to remove HTS/HBAR liquidity', async () => {

		})

		it('should be able to swap HTS/HBAR', async () => {

		})

		it('should revert if associate fails with != 22 || 167 error code', async () => {

		})

	})
});

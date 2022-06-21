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
	this.timeout(120_000); // Router + Factory deployment is slow

	let deployer: SignerWithAddress;
	let factory: Contract;
	let router: Contract;
	let whbar: Contract;
	const decimals = 10 ** 8;

	before(async () => {
		// @ts-ignore
		[deployer] = await hardhat.hethers.getSigners();


		// Uncomment for brand new redeployment
		const whbar = await deployWhbar();
		const result = await deployHeliSwap(whbar);
		router = result.router;
		factory = result.factory;
	});

	describe('HTS related tests', function () {
		const TOKEN_A_SUPPLY = 10_000 * decimals; // 10k
		const TOKEN_B_SUPPLY = 100_000 * decimals; // 100k

		let tokenA: Contract;
		let tokenB: Contract;
		let HTSComputedPairAddress: String;
		let MixedComputedPairAddress: String;

		before(async () => {
			const newTokenA = await createHTS("TokenA", "TA", TOKEN_A_SUPPLY);
			const newTokenB = await createHTS("TokenB", "TB", TOKEN_B_SUPPLY);

			// @ts-ignore
			tokenA = await hardhat.hethers.getContractAt(ERC20, newTokenA.tokenAddress);
			// @ts-ignore
			tokenB = await hardhat.hethers.getContractAt(ERC20, newTokenB.tokenAddress);

			HTSComputedPairAddress = await computePairAddress(tokenA.address, tokenB.address, factory.address);
			MixedComputedPairAddress = await computePairAddress(tokenA.address, whbar.address, factory.address);
		});

		it('should be able to add/remove HTS/HTS liquidity', async () => {
			const addAmount0 = 1000 * decimals;
			const addAmount1 = 5000 * decimals;

			const removeAmount0 = 2 * decimals;
			const removeAmount1 = 4 * decimals;

			await tokenA.approve(router.address, addAmount0);
			await tokenB.approve(router.address, addAmount1);
			expect(await router.addLiquidity(
				tokenA.address,
				tokenB.address,
				addAmount0,
				addAmount1,
				addAmount0,
				addAmount1,
				deployer.address,
				getExpiry()))
				.to.emit(factory, "PairCreated")
				.withArgs(tokenA.address, tokenB.address, HTSComputedPairAddress, "TokenA", "TA", "TokenB", "TB");

			const reserves = await router.getReserves(tokenA.address, tokenB.address);
			expect(BigNumber.from(reserves.reserveA).toNumber()).to.be.eq(addAmount0);
			expect(BigNumber.from(reserves.reserveB).toNumber()).to.be.eq(addAmount1);

			// @ts-ignore
			const pairContract = await hardhat.hethers.getContractAt(PAIR, HTSComputedPairAddress);
			const supply = BigNumber.from(await pairContract.totalSupply()).toNumber();
			const removableLiquidity = (supply/100).toString().split(".")[0];
			await pairContract.approve(router.address, 1000 * decimals);

			expect(await router.removeLiquidity(
				tokenA.address,
				tokenB.address,
				removableLiquidity,
				removeAmount0,
				removeAmount1,
				deployer.address,
				getExpiry()
			)).to.emit(pairContract, "Burn").withArgs(deployer.address, removeAmount0, removeAmount1, removableLiquidity)
				.to.emit(pairContract, "Sync")
		});

		it('should be able to swap HTS/HTS', async () => {
			const amount0 = 200 * decimals;
			const amount1 = 600 * decimals;
			await tokenA.approve(router.address, amount0);
			await tokenB.approve(router.address, amount1);

			// @ts-ignore
			const pairContract = await hardhat.hethers.getContractAt(PAIR, HTSComputedPairAddress);

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
			const amountHts  = 10 * decimals;
			const amountHbar = 50;

			await whbar.deposit({value: amountHbar})
			await tokenA.approve(router.address, amountHts);
			await whbar.approve(router.address, amountHbar * whbarDecimals);

			expect(await router.addLiquidityETH(
				tokenA.address,
				amountHts,
				amountHts,
				amountHbar,
				deployer.address,
				getExpiry(), {value: amountHbar})).to.emit(factory, "PairCreated")
				.withArgs(tokenA.address, whbar.address, MixedComputedPairAddress, "TokenA", "TA", "WHBAR", "HBAR");
		})

		// FIXME: This case is currently failing and being investigated... Will be resolved soon.
		xit('should be able to remove HTS/HBAR liquidity', async () => {
			// await new Promise(async (resolve, reject) => {setTimeout(resolve, 10000)});
			const whbarDecimals = (10 ** await whbar.decimals());
			const amountHts  = decimals;
			const amountHbar = 5;
			const pairAddress = await factory.getPair(tokenA.address, whbar.address);

			// @ts-ignore
			const pairContract = await hardhat.hethers.getContractAt(PAIR, pairAddress);
			const supply = BigNumber.from(await pairContract.totalSupply()).toNumber();
			const removableLiquidity = (supply/10).toString().split(".")[0];
			await pairContract.approve(router.address, removableLiquidity + 1);

			console.log(`Will remove ${removableLiquidity} HTS/HBAR liquidity`);
			await tokenA.approve(router.address, amountHts + 1);
			await whbar.approve(router.address, amountHbar * whbarDecimals + 1);

			expect(await router.removeLiquidityETH(
				tokenA.address,
				removableLiquidity,
				amountHts,
				amountHbar,
				deployer.address,
				getExpiry()
			)).to.emit(pairContract, "Burn").withArgs(deployer.address, removableLiquidity, amountHbar)
		})

		it('should be able to swap HTS/HBAR', async () => {
			const amount0 = 100 * decimals;
			const amountHbar = 4;
			await tokenA.approve(router.address, amount0);
			await whbar.approve(router.address, amountHbar*decimals);

			// @ts-ignore
			const pairContract = await hardhat.hethers.getContractAt(PAIR, MixedComputedPairAddress);

			// @ts-ignore
			expect(await router.swapExactTokensForETH(
				amount0,
				amountHbar,
				[tokenA.address, whbar.address],
				deployer.address,
				getExpiry())).to.emit(pairContract, "Swap").withArgs(amount0, amountHbar, deployer.address);
		})

		it('should revert if associate fails with != 22 || 167 error code', async () => {
			await expect(factory.createPair(tokenA.address, deployer.address)).to.be.reverted;
			await expect(factory.createPair(deployer.address, tokenA.address)).to.be.reverted;
		})
	})
});

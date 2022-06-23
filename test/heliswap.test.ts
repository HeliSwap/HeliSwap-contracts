import hardhat from "hardhat";
import {SignerWithAddress} from "hardhat-hethers/internal/signers";
import {BigNumber, Contract} from "@hashgraph/hethers";
import {Utils} from "../utils/utils";
import {expect} from "chai";
import {getCreate2Address, keccak256, solidityPack, getAddress, Interface} from "ethers/lib/utils";
import getExpiry = Utils.getExpiry;
import findLogAndAssert = Utils.findLogAndAssert;

const createHTS = require('../scripts/utilities/create-hts');

const ERC20 = "contracts/core/interfaces/IERC20.sol:IERC20";
const PAIR = "contracts/core/interfaces/IUniswapV2Pair.sol:IUniswapV2Pair";

const pairCreatedEventABI = [ `event PairCreated(address indexed token0, address indexed token1, address pair, uint pairSeqNum, string token0Symbol, string token1Symbol, string token0Name, string token1Name, uint token0Decimals, uint token1Decimals)` ];
const burnEventABI = [ `event Burn(address indexed sender, uint amount0, uint amount1, address indexed to, uint amountLp)` ];
const syncEventABI = [ `event Sync(uint112 reserve0, uint112 reserve1, uint totalSupply)` ];
const swapEventABI = [ `event Swap(address indexed sender, uint amount0In, uint amount1In, uint amount0Out, uint amount1Out, address indexed to)` ];

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
		// const whbar = await deployWhbar();
		// const result = await deployHeliSwap(whbar);
		// router = result.router;
		// factory = result.factory;

		// @ts-ignore
		whbar = await hardhat.hethers.getContractAt("WHBAR", '0x0000000000000000000000000000000002bc617f');
		// @ts-ignore
		factory = await hardhat.hethers.getContractAt("UniswapV2Factory", '0x0000000000000000000000000000000002be607e');
		// @ts-ignore
		router = await hardhat.hethers.getContractAt("UniswapV2Router02", '0x0000000000000000000000000000000002be6080');
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
			MixedComputedPairAddress = await computePairAddress(whbar.address, tokenA.address, factory.address);
		});

		it('should be able to add HTS/HTS liquidity', async () => {
			const addAmount0 = 1000 * decimals;
			const addAmount1 = 5000 * decimals;

			await tokenA.approve(router.address, addAmount0);
			await tokenB.approve(router.address, addAmount1);

			let addLiquidityTX = await router.addLiquidity(
				tokenA.address,
				tokenB.address,
				addAmount0,
				addAmount1,
				addAmount0,
				addAmount1,
				deployer.address,
				getExpiry())

			addLiquidityTX = await addLiquidityTX.wait()

			findLogAndAssert(addLiquidityTX.logs, pairCreatedEventABI,
				{
					token0: getAddress(tokenA.address),
					token1: getAddress(tokenB.address),
					pair: getAddress(HTSComputedPairAddress.toString()),
					token0Symbol: "TA",
					token1Symbol: "TB",
					token0Name: "TokenA",
					token1Name: "TokenB",
					token0Decimals: "8",
					token1Decimals: "8"
				},
			)

			const reserves = await router.getReserves(tokenA.address, tokenB.address);
			expect(BigNumber.from(reserves.reserveA).toNumber()).to.be.eq(addAmount0);
			expect(BigNumber.from(reserves.reserveB).toNumber()).to.be.eq(addAmount1);
		});

		it('should be able to remove HTS/HTS liquidity', async () => {
			// @ts-ignore
			const pairContract = await hardhat.hethers.getContractAt(PAIR, HTSComputedPairAddress);
			const supply = BigNumber.from(await pairContract.totalSupply()).toNumber();
			const removableLiquidity = (supply/100).toString().split(".")[0];
			await pairContract.approve(router.address, 1000 * decimals);

			const removeAmount0 = 2 * decimals;
			const removeAmount1 = 4 * decimals;

			let removeLiquidityTX = await router.removeLiquidity(
				tokenA.address,
				tokenB.address,
				removableLiquidity,
				removeAmount0,
				removeAmount1,
				deployer.address,
				getExpiry()
			)

			removeLiquidityTX = await removeLiquidityTX.wait()

			// FIXME: check the log field values and assert properly
			findLogAndAssert(removeLiquidityTX.logs, burnEventABI,
				{
					to: getAddress(deployer.address)
				}
			)

			findLogAndAssert(removeLiquidityTX.logs, syncEventABI,
				{
					reserve0: "99000000001",
					reserve1: "495000000002",
					totalSupply: "221370729772"
				}
			)
		})

		it('should be able to swap HTS/HTS', async () => {
			const amount0 = 200 * decimals;
			const amount1 = 600 * decimals;
			await tokenA.approve(router.address, amount0);
			await tokenB.approve(router.address, amount1);

			// @ts-ignore
			const pairContract = await hardhat.hethers.getContractAt(PAIR, HTSComputedPairAddress);

			let swapTx = await router.swapExactTokensForTokens(
				amount0,
				amount1,
				[tokenA.address, tokenB.address],
				deployer.address,
				getExpiry())

			swapTx = await swapTx.wait()

			findLogAndAssert(swapTx.logs, swapEventABI,
				{
					to: getAddress(deployer.address),
					amount0In: amount0,
					amount1Out: "82985538926"
				}
			)
		})

		it('should be able to add HTS/HBAR liquidity', async () => {
			const whbarDecimals = (10 ** await whbar.decimals());
			const amountHts  = 10 * decimals;
			const amountHbar = 50;

			await whbar.deposit({value: amountHbar})
			await tokenA.approve(router.address, amountHts);
			await whbar.approve(router.address, amountHbar * whbarDecimals);

			let addLiquidityETHTx = await router.addLiquidityETH(
				tokenA.address,
				amountHts,
				amountHts,
				amountHbar,
				deployer.address,
				getExpiry(), {value: amountHbar})

			addLiquidityETHTx = await addLiquidityETHTx.wait()

			findLogAndAssert(addLiquidityETHTx.logs, pairCreatedEventABI,
				{
					token0: getAddress(whbar.address),
					token1: getAddress(tokenA.address),
					pair: getAddress(MixedComputedPairAddress.toString()),
					token0Symbol: "WHBAR",
					token1Symbol: "TA",
					token0Name: "Wrapped Hbar",
					token1Name: "TokenA",
					token0Decimals: "8",
					token1Decimals: "8"
				})
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

			await expect(router.removeLiquidityETH(
				tokenA.address,
				removableLiquidity,
				amountHts,
				amountHbar,
				deployer.address,
				getExpiry()
			)).to.emit(pairContract, "Burn").withArgs(deployer.address, removableLiquidity, amountHbar)
		})

		xit('should be able to swap HTS/HBAR', async () => {
			const amount0 = 100 * decimals;
			const amountHbar = 4;
			await tokenA.approve(router.address, amount0);
			await whbar.approve(router.address, amountHbar*decimals);

			// @ts-ignore
			const pairContract = await hardhat.hethers.getContractAt(PAIR, MixedComputedPairAddress);

			await router.swapExactTokensForETH(
				amount0,
				amountHbar,
				[tokenA.address, whbar.address],
				deployer.address,
				getExpiry());

			// @ts-ignore
			await expect(router.swapExactTokensForETH(
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

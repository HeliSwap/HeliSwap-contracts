import hardhat from "hardhat";
import {SignerWithAddress} from "hardhat-hethers/internal/signers";
import {Contract} from "@hashgraph/hethers";
import {Utils} from "../utils/utils";
import getExpiry = Utils.getExpiry;

const deployHeliSwap = require('../scripts/deploy');
const createHTS = require('../scripts/utilities/create-hts');

const ERC20 = "contracts/core/interfaces/IERC20.sol:IERC20";
describe('HeliSwap Tests', function () {
	// this.timeout(120_000); // Router + Factory deployment is slow

	let deployer: SignerWithAddress;
	let factory: Contract;
	let router: Contract;

	before(async () => {
    // @ts-ignore
    [deployer] = await hardhat.hethers.getSigners();

    // Uncomment for brand new redeployment
    // @ts-ignore
    // const WHBAR = await hardhat.hethers.getContractFactory('MockWHBAR');
    // const whbar = await WHBAR.deploy();
    // await whbar.deployed();
    // const result = await deployHeliSwap(whbar.address);
    // router = result.router;
    // factory = result.factory;

    // @ts-ignore
    factory = await hardhat.hethers.getContractAt(
      'UniswapV2Factory',
      '0x0000000000000000000000000000000002bd247c'
    );
    // @ts-ignore
    router = await hardhat.hethers.getContractAt(
      'UniswapV2Router02',
      '0x0000000000000000000000000000000002bd2480'
    );
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
		});

		it('should be able to remove HTS/HTS liquidity', async () => {

		})

		it('should be able to swap HTS/HTS', async () => {

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

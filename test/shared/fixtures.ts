import UniswapV2Factory from '../../artifacts/contracts/core/UniswapV2Factory.sol/UniswapV2Factory.json';
import hardhat from "hardhat";
import {Contract, hethers} from "@hashgraph/hethers";
// @ts-ignore
import createHTS from "../../scripts/utilities/create-hts";
import {Utils} from "../../utils/utils";
import expandTo18Decimals = Utils.expandTo18Decimals;
import expandTo8Decimals = Utils.expandTo8Decimals;

const IERC20 = "contracts/core/interfaces/IERC20.sol:IERC20";
const IPAIR = "contracts/core/interfaces/IUniswapV2Pair.sol:IUniswapV2Pair";

export async function factoryFixture(feeToSetter: string): Promise<Contract> {
	// @ts-ignore
	const HeliSwapFactory = await hardhat.hethers.getContractFactory("UniswapV2Factory");
	// @ts-ignore
	const factory = await HeliSwapFactory.deploy(feeToSetter);
	await factory.deployTransaction.wait();

	return factory;
}

export async function htsFixture(): Promise<Contract> {
	const newTokenA = await createHTS("TokenA", "TA", expandTo8Decimals(10_000));
	// @ts-ignore
	return await hardhat.hethers.getContractAt(IERC20, newTokenA.tokenAddress);
}

export async function erc20Fixture(): Promise<Contract> {
	// @ts-ignore
	const ERC20 = await hardhat.hethers.getContractFactory("contracts/mock/ERC20.sol:ERC20");
	const erc20 = await ERC20.deploy(expandTo18Decimals(10_000));
	await erc20.deployed();
	return erc20;
}

export async function pairFixture(factory: Contract, types: [boolean, boolean]): Promise<PairFixture> {
	const tokenA = types[0] ? await htsFixture() : await erc20Fixture();
	const tokenB = types[1] ? await htsFixture() : await erc20Fixture();

	await factory.createPair(tokenA.address, tokenB.address)
	const pairAddress = await factory.getPair(tokenA.address, tokenB.address)
	// @ts-ignore
	const pair = await hardhat.hethers.getContractAt(IPAIR, pairAddress);
	const token0Address = await pair.token0();
	const token0 = hethers.utils.getAddress(tokenA.address) === token0Address ? tokenA : tokenB
	const token1 = hethers.utils.getAddress(tokenA.address) === token0Address ? tokenB : tokenA
	return { token0, token1, pair }
}

export async function routerFixture(factory: Contract, whbar: Contract): Promise<Contract> {
	// @ts-ignore
	const HeliSwapRouter = await hardhat.hethers.getContractFactory("UniswapV2Router02");
	const router = await HeliSwapRouter.deploy(factory.address, whbar.address);
	await router.deployed();
	return router;
}

export async function whbarFixture(): Promise<Contract> {
	// @ts-ignore
	const WHBAR = await hardhat.hethers.getContractFactory('MockWHBAR');
	let whbar = await WHBAR.deploy();
	await whbar.deployed();
	return whbar;
}

export async function eventEmitterFixture(): Promise<Contract> {
	// @ts-ignore
	const EventEmitter = await hardhat.hethers.getContractFactory("RouterEventEmitter");
	const emitter = await EventEmitter.deploy();
	await emitter.deployed();
	return emitter;
}

interface PairFixture {
	token0: Contract
	token1: Contract
	pair: Contract
}
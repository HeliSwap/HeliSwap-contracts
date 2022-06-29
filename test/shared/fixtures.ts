import UniswapV2Factory from '../../artifacts/contracts/core/UniswapV2Factory.sol/UniswapV2Factory.json';
import hardhat from "hardhat";
import {Contract} from "@hashgraph/hethers";
// @ts-ignore
import createHTS from "../../scripts/utilities/create-hts";
const ERC20 = "contracts/core/interfaces/IERC20.sol:IERC20";

export async function factoryFixture(address: string): Promise<Contract> {
	// @ts-ignore
	const HeliSwapFactory = await hardhat.hethers.getContractFactory("UniswapV2Factory");
	// @ts-ignore
	const factory = await HeliSwapFactory.deploy(address);
	await factory.deployTransaction.wait();
	return factory;
}

const TOKEN_A_SUPPLY = 10_000 * 8; // 10k
export async function htsFixture(): Promise<Contract> {
	const newTokenA = await createHTS("TokenA", "TA", TOKEN_A_SUPPLY);
	// @ts-ignore
	return await hardhat.hethers.getContractAt(ERC20, newTokenA.tokenAddress);
}
import * as hethers from "@hashgraph/hethers";
import {expect} from "chai";
import {BigNumber} from "@hashgraph/hethers";
import UniswapV2Pair from '../artifacts/contracts/core/UniswapV2Pair.sol/UniswapV2Pair.json';

export namespace Utils {

	const TEN_MINUTES = 600_000;

	export function getExpiry() {
		return (new Date()).getTime() + TEN_MINUTES;
	}

	export function getCreate2Address(
		factoryAddress: string,
		[tokenA, tokenB]: [string, string]
	): string {
		const bytecode = `${UniswapV2Pair.bytecode}`
		const [token0, token1] = tokenA < tokenB ? [tokenA, tokenB] : [tokenB, tokenA]
		const create2Inputs = [
			'0xff',
			factoryAddress,
			hethers.utils.keccak256(hethers.utils.solidityPack(['address', 'address'], [token0, token1])),
			hethers.utils.keccak256(bytecode)
		]
		const sanitizedInputs = `0x${create2Inputs.map(i => i.slice(2)).join('')}`
		return hethers.utils.getAddress(`0x${hethers.utils.keccak256(sanitizedInputs).slice(-40)}`)
	}

	export async function expectRevert(tx: any) {
		try {
			await tx;
		} catch (e: any) {
			expect(e.code).to.equal("CONTRACT_REVERT_EXECUTED");
		}
	}

	export function expandTo18Decimals(n: number): BigNumber {
		return hethers.BigNumber.from(n).mul(hethers.BigNumber.from(10).pow(18))
	}
}

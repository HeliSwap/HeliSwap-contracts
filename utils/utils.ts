import * as hethers from "@hashgraph/hethers";
import {expect} from "chai";
import {BigNumber} from "@hashgraph/hethers";

export namespace Utils {

	const TEN_MINUTES = 600_000;

	export function getExpiry() {
		return (new Date()).getTime() + TEN_MINUTES;
	}

	export const computePairAddress = async (t1: string, t2: string, factory: string): Promise<string> => {
		const getInitCodeHash = require('../scripts/utilities/get-init-code-hash');
		const initCodeHash = await getInitCodeHash();
		return hethers.utils.getCreate2Address(
			factory,
			hethers.utils.keccak256(hethers.utils.solidityPack(['address', 'address'], [t1, t2])),
			initCodeHash);
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

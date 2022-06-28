import * as hethers from "@hashgraph/hethers";
import {LogDescription} from "ethers/lib/utils";
import {expect} from "chai";

export default async function expectTx(transaction: hethers.ContractFunction): Promise<LogBuilder> {
	let tx = await transaction;
	// @ts-ignore
	tx = await tx.wait();
	// @ts-ignore
	return new LogBuilder(tx);
}

export class LogBuilder {
	public readonly tx: hethers.ContractReceipt
	public targetEvent?: LogDescription

	constructor(_tx: hethers.ContractReceipt) {
		this.tx = _tx;
	}

	toEmitted(contract: hethers.Contract, name: string): LogBuilder {
		let found = false;
		for (const log of this.tx.logs) {
			try {
				let parsedLog = contract.interface.parseLog(log);
				if (parsedLog.name == name) {
					found = true;
					this.targetEvent = parsedLog;
					return this;
				}
			} catch (e) {
			}
		}
		expect(found).to.be.equal(true, `Transaction did not emit ${name} event`);
		return this;
	}

	withArgs(...args: any[]): LogBuilder {
		for (const index in args) {
			if (!args[index]) {
				continue;
			}
			expect(args[index]).to.equal(this.targetEvent?.args[index].toString(), `Argument expected to be ${args[index]}, but was ${this.targetEvent?.args[index]}`);
		}

		return this;
	}
}

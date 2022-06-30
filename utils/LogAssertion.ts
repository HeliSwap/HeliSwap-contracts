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
	public targetEvents?: LogDescription[]

	constructor(_tx: hethers.ContractReceipt) {
		this.tx = _tx;
	}

	toEmitted(contract: hethers.Contract, name: string): LogBuilder {
		this.targetEvents = [];
		let found = false;
		for (const log of this.tx.logs) {
			try {
				let parsedLog = contract.interface.parseLog(log);
				if (parsedLog.name == name) {
					found = true;
					this.targetEvents?.push(parsedLog);
				}
			} catch (e) {
			}
		}
		expect(found).to.be.equal(true, `Transaction did not emit ${name} event`);
		return this;
	}

	withArgs(...args: any[]): LogBuilder {
		if (!this.targetEvents) throw Error('Wrong usage of withArgs')

		let eventFindings = [];
		for (let i = 0; i < this.targetEvents.length; i++) {
			let found = true;
			for (const index in args) {
				if (!args[index]) {
					continue;
				}
				if (args[index] != this.targetEvents[i].args[index].toString()) {
					found = false;
				}
			}
			eventFindings.push(found);
		}
		expect(eventFindings).to.contain(true, `Expected to find the following arguments ${args}. Received events: ${this.targetEvents.toString()}`);
		return this;
	}
}

import {Interface, LogDescription} from "ethers/lib/utils";
import {expect} from "chai";

export namespace Utils {

	const TEN_MINUTES = 600_000;

	export function getExpiry() {
		return (new Date()).getTime() + TEN_MINUTES;
	}

	export function findLogAndAssert(logs: any, eventABI: any, assertions: any) {
		for (const log of logs) {
			let parsed: LogDescription
			try{
				parsed = new Interface(eventABI).parseLog(log)

				Object.keys(assertions).forEach(function (key) {
					expect(parsed.args[key].toString()).to.be.equal(assertions[key].toString())
				})
			} catch (e) {
				continue
			}
			return
		}
		throw new Error(`${eventABI} not found`)
	}
}

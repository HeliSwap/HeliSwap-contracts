import chai, {expect} from 'chai'
import {solidity} from 'ethereum-waffle'

import {factoryFixture, htsFixture} from './shared/fixtures'
import {Utils} from "../utils/utils";
import {SignerWithAddress} from "hardhat-hethers/internal/signers";
import hardhat from "hardhat";
import {Contract, hethers} from "@hashgraph/hethers";
import getAddress = hethers.utils.getAddress;
import expectTx from "../utils/LogAssertion";
import getCreate2Address = Utils.getCreate2Address;
const IPAIR = "contracts/core/interfaces/IUniswapV2Pair.sol:IUniswapV2Pair";

chai.use(solidity)

describe('UniswapV2Factory', () => {

	let wallet: SignerWithAddress;
	let other: SignerWithAddress;
	let TEST_ADDRESSES = ["0", "0"];

	before(async () => {
		// @ts-ignore
		[wallet, other] = await hardhat.hethers.getSigners();
		TEST_ADDRESSES[0] = ((await htsFixture()).address);
		TEST_ADDRESSES[1] = ((await htsFixture()).address);
	})

	let factory: Contract
	beforeEach(async () => {
		factory = await factoryFixture(wallet.address);
	})

	it('feeTo, feeToSetter, allPairsLength', async () => {
		expect(await factory.feeTo()).to.eq(hethers.constants.AddressZero)
		expect(await factory.feeToSetter()).to.eq(getAddress(wallet.address))
		expect(await factory.allPairsLength()).to.eq(0)
	})

	async function createPair(tokens: [string, string]) {
		const create2Address = getCreate2Address(factory.address, tokens);
		(await expectTx(factory.createPair(...tokens))).toEmitted(factory, 'PairCreated')
			.withArgs(
				getAddress(TEST_ADDRESSES[0]),
				getAddress(TEST_ADDRESSES[1]),
				getAddress(create2Address),
				hethers.BigNumber.from(1)
			);
		await Utils.expectRevert(factory.createPair(...tokens)); // UniswapV2: PAIR_EXISTS
		await Utils.expectRevert(factory.createPair(...tokens.slice().reverse())) // UniswapV2: PAIR_EXISTS
		expect(await factory.getPair(...tokens)).to.eq(create2Address)
		expect(await factory.getPair(...tokens.slice().reverse())).to.eq(create2Address)
		expect(await factory.allPairs(0)).to.eq(create2Address)
		expect(await factory.allPairsLength()).to.eq(1)

		// @ts-ignore
		const pair = await hardhat.hethers.getContractAt(IPAIR, create2Address)
		expect(await pair.factory()).to.eq(getAddress(factory.address))
		expect(await pair.token0()).to.eq(getAddress(TEST_ADDRESSES[0]))
		expect(await pair.token1()).to.eq(getAddress(TEST_ADDRESSES[1]))
	}

	it('createPair', async () => {
		await createPair(TEST_ADDRESSES as [string, string])
	})

	it('createPair:reverse', async () => {
		await createPair(TEST_ADDRESSES.slice().reverse() as [string, string])
	})

	it('setFeeTo', async () => {
		// @ts-ignore
		await Utils.expectRevert(factory.connect(other).setFeeTo(other.address));
		(await expectTx(factory.setFeeTo(wallet.address)))
			.toEmitted(factory, "FeeReceiverChanged")
			.withArgs(getAddress(wallet.address))
		expect(await factory.feeTo()).to.eq(getAddress(wallet.address))
	})

	it('setFeeToSetter', async () => {
		// @ts-ignore
		await Utils.expectRevert(factory.connect(other).setFeeToSetter(other.address));
		(await expectTx(factory.setFeeToSetter(other.address)))
			.toEmitted(factory, "FeeSetterChanged")
			.withArgs(getAddress(other.address))
		expect(await factory.feeToSetter()).to.eq(getAddress(other.address))
		await Utils.expectRevert(factory.setFeeToSetter(wallet.address))
	})
})

import chai, {expect} from 'chai'
import {solidity} from 'ethereum-waffle'

import {Contract, hethers} from "@hashgraph/hethers";
import getAddress = hethers.utils.getAddress;
import hardhat from "hardhat";
import {SignerWithAddress} from "hardhat-hethers/internal/signers";
import expectTx from "../utils/LogAssertion";
import {Utils} from "../utils/utils";
import expandTo18Decimals = Utils.expandTo18Decimals;
import expectRevert = Utils.expectRevert;

chai.use(solidity)

const TOTAL_SUPPLY = expandTo18Decimals(10000)
const TEST_AMOUNT = expandTo18Decimals(10)

describe('UniswapV2ERC20', () => {

	let wallet: SignerWithAddress;
	let other: SignerWithAddress;

	let token: Contract

	before(async () => {
		// @ts-ignore
		[wallet, other] = await hardhat.hethers.getSigners();
	});

	beforeEach(async () => {
		// @ts-ignore
		token = await hardhat.hethers.getContractFactory('contracts/mock/TestUniswapV2ERC20.sol:TestUniswapV2ERC20');
		token = await token.deploy(TOTAL_SUPPLY);
		await token.deployTransaction.wait();
	})

	it('name, symbol, decimals, totalSupply, balanceOf, DOMAIN_SEPARATOR, PERMIT_TYPEHASH', async () => {
		const name = await token.name()
		expect(name).to.eq('Uniswap V2')
		expect(await token.symbol()).to.eq('UNI-V2')
		expect(await token.decimals()).to.eq(18)
		expect(await token.totalSupply()).to.eq(TOTAL_SUPPLY)
		expect(await token.balanceOf(wallet.address)).to.eq(TOTAL_SUPPLY)
		expect(await token.PERMIT_TYPEHASH()).to.eq(
			hethers.utils.keccak256(hethers.utils.toUtf8Bytes('Permit(address owner,address spender,uint256 value,uint256 nonce,uint256 deadline)'))
		)
	})

	it('approve', async () => {
		(await expectTx(token.approve(other.address, TEST_AMOUNT)))
			.toEmitted(token, "Approval").withArgs(getAddress(wallet.address), getAddress(other.address), TEST_AMOUNT);
		expect(await token.allowance(wallet.address, other.address)).to.eq(TEST_AMOUNT)
	})

	it('transfer', async () => {
		(await expectTx(token.transfer(other.address, TEST_AMOUNT)))
			.toEmitted(token, "Transfer").withArgs(getAddress(wallet.address), getAddress(other.address), TEST_AMOUNT);
		expect(await token.balanceOf(wallet.address)).to.eq(TOTAL_SUPPLY.sub(TEST_AMOUNT))
		expect(await token.balanceOf(other.address)).to.eq(TEST_AMOUNT)
	})

	it('transfer:fail', async () => {
		await expectRevert(token.transfer(other.address, TOTAL_SUPPLY.add(1)));
		// @ts-ignore
		await expectRevert(token.connect(other).transfer(wallet.address, 1));
	})

	it('transferFrom', async () => {
		let tx = await token.approve(other.address, TEST_AMOUNT);
		await tx.wait();

		// @ts-ignore
		(await expectTx(token.connect(other).transferFrom(wallet.address, other.address, TEST_AMOUNT)))
			.toEmitted(token, 'Transfer')
			.withArgs(getAddress(wallet.address), getAddress(other.address), TEST_AMOUNT)
		expect(await token.allowance(wallet.address, other.address)).to.eq(0)
		expect(await token.balanceOf(wallet.address)).to.eq(TOTAL_SUPPLY.sub(TEST_AMOUNT))
		expect(await token.balanceOf(other.address)).to.eq(TEST_AMOUNT)
	})

	it('transferFrom:max', async () => {
		let tx = await token.approve(other.address, hethers.constants.MaxUint256);
		await tx.wait();

		// @ts-ignore
		(await expectTx(token.connect(other).transferFrom(wallet.address, other.address, TEST_AMOUNT)))
			.toEmitted(token, 'Transfer')
			.withArgs(getAddress(wallet.address), getAddress(other.address), TEST_AMOUNT)
		expect(await token.allowance(wallet.address, other.address)).to.eq(hethers.constants.MaxUint256)
		expect(await token.balanceOf(wallet.address)).to.eq(TOTAL_SUPPLY.sub(TEST_AMOUNT))
		expect(await token.balanceOf(other.address)).to.eq(TEST_AMOUNT)
	})

})

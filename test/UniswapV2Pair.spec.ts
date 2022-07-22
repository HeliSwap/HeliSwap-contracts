import chai, {expect} from 'chai'
import {solidity} from 'ethereum-waffle'
import {factoryFixture, pairFixture} from './shared/fixtures'
import {BigNumber, Contract, hethers} from "@hashgraph/hethers";
import getAddress = hethers.utils.getAddress;
import {SignerWithAddress} from "hardhat-hethers/internal/signers";
import hardhat from "hardhat";
import {Utils} from "../utils/utils";
import expandTo18Decimals = Utils.expandTo18Decimals;
import expandTo8Decimals = Utils.expandTo8Decimals;
import expectTx from "../utils/LogAssertion";
import expectRevert = Utils.expectRevert;

const MINIMUM_LIQUIDITY = hethers.BigNumber.from(10).pow(3)

chai.use(solidity)

describe('UniswapV2Pair', () => {

	let wallet: SignerWithAddress;
	let other: SignerWithAddress;
	let token0: Contract;
	let isToken0HTS: boolean;
	let isToken1HTS: boolean;
	let token1: Contract
	let pair: Contract

	before(async () => {
		// @ts-ignore
		[wallet, other] = await hardhat.hethers.getSigners();
		factory = await factoryFixture(wallet.address);
	})

	let factory: Contract
	beforeEach(async () => {
		isToken0HTS = true;
		isToken1HTS = true;
		const fixture = await pairFixture(factory, [true, true]);
		token0 = fixture.token0
		token1 = fixture.token1
		pair = fixture.pair
	})

	it('mint', async () => {
		const token0Amount = isToken0HTS ? expandTo8Decimals(1) : expandTo18Decimals(1)
		const token1Amount = isToken1HTS ? expandTo8Decimals(4): expandTo18Decimals(4)
		await token0.transfer(pair.address, token0Amount)
		await token1.transfer(pair.address, token1Amount)

		const expectedLiquidity = expandTo8Decimals(2); // TODO not generic enough
		(await expectTx(pair.mint(wallet.address)))
			.toEmitted(pair, 'Transfer')
			.withArgs(hethers.constants.AddressZero, hethers.constants.AddressZero, MINIMUM_LIQUIDITY)
			.toEmitted(pair, 'Transfer')
			.withArgs(hethers.constants.AddressZero, getAddress(wallet.address), expectedLiquidity.sub(MINIMUM_LIQUIDITY))
			.toEmitted(pair, 'Sync')
			.withArgs(token0Amount, token1Amount, expectedLiquidity)
			.toEmitted(pair, 'Mint')
			.withArgs(getAddress(wallet.address), token0Amount, token1Amount, getAddress(wallet.address), expectedLiquidity.sub(MINIMUM_LIQUIDITY))

		expect(await pair.totalSupply()).to.eq(expectedLiquidity)
		expect(await pair.balanceOf(wallet.address)).to.eq(expectedLiquidity.sub(MINIMUM_LIQUIDITY))
		expect(await token0.balanceOf(pair.address)).to.eq(token0Amount)
		expect(await token1.balanceOf(pair.address)).to.eq(token1Amount)
		const reserves = await pair.getReserves()
		expect(reserves[0]).to.eq(token0Amount)
		expect(reserves[1]).to.eq(token1Amount)
	})

	async function addLiquidity(token0Amount: BigNumber, token1Amount: BigNumber) {
		await token0.transfer(pair.address, token0Amount)
		await token1.transfer(pair.address, token1Amount)
		await pair.mint(wallet.address)
	}

	// TODO only HTS
	const swapTestCases: BigNumber[][] = [
		[1, 5, 10, '166249791'],
		[1, 10, 5, '45330544'],

		[2, 5, 10, '285101515'],
		[2, 10, 5, '83124895'],

		[1, 10, 10, '90661089'],
		[1, 100, 100, '98715803'],
		[1, 1000, 1000, '99600698']

	].map(a => a.map(n => (typeof n === 'string' ? hethers.BigNumber.from(n) : expandTo8Decimals(n))))
	swapTestCases.forEach((swapTestCase, i) => {
		it(`getInputPrice:${i}`, async () => {
			const [swapAmount, token0Amount, token1Amount, expectedOutputAmount] = swapTestCase
			await addLiquidity(token0Amount, token1Amount)
			await token0.transfer(pair.address, swapAmount)
			await expectRevert(pair.swap(0, expectedOutputAmount.add(1), wallet.address, '0x'))
			await pair.swap(0, expectedOutputAmount, wallet.address, '0x')
		})
	})

	const optimisticTestCases: BigNumber[][] = [
		['99700000', 5, 10, 1], // given amountIn, amountOut = floor(amountIn * .997)
		['99700000', 10, 5, 1],
		['99700000', 5, 5, 1]
	].map(a => a.map(n => (typeof n === 'string' ? hethers.BigNumber.from(n) : expandTo8Decimals(n))))
	optimisticTestCases.forEach((optimisticTestCase, i) => {
		it(`optimistic:${i}`, async () => {
			const [outputAmount, token0Amount, token1Amount, inputAmount] = optimisticTestCase;
			await addLiquidity(token0Amount, token1Amount);
			await token0.transfer(pair.address, inputAmount);
			await expectRevert(pair.swap(outputAmount.add(1), 0, wallet.address, '0x'));
			await pair.swap(outputAmount, 0, wallet.address, '0x');
		})
	})

	it('swap:token0', async () => {
		const token0Amount = isToken0HTS ? expandTo8Decimals(5) : expandTo18Decimals(5);
		const token1Amount = isToken1HTS ? expandTo8Decimals(10): expandTo18Decimals(10);
		await addLiquidity(token0Amount, token1Amount);

		const swapAmount = isToken0HTS ? expandTo8Decimals(1) : expandTo18Decimals(1);
		const expectedOutputAmount = hethers.BigNumber.from('166249791');

		await token0.transfer(pair.address, swapAmount);
		(await expectTx(pair.swap(0, expectedOutputAmount, wallet.address, '0x')))
			.toEmitted(token1, 'Transfer')
			.withArgs(undefined, getAddress(wallet.address), expectedOutputAmount)
			.toEmitted(pair, 'Sync')
			.withArgs(token0Amount.add(swapAmount), token1Amount.sub(expectedOutputAmount))
			.toEmitted(pair, 'Swap')
			.withArgs(getAddress(wallet.address), swapAmount, 0, 0, expectedOutputAmount, getAddress(wallet.address))

		const reserves = await pair.getReserves()
		expect(reserves[0]).to.eq(token0Amount.add(swapAmount))
		expect(reserves[1]).to.eq(token1Amount.sub(expectedOutputAmount))
		expect(await token0.balanceOf(pair.address)).to.eq(token0Amount.add(swapAmount))
		expect(await token1.balanceOf(pair.address)).to.eq(token1Amount.sub(expectedOutputAmount))
		const totalSupplyToken0 = await token0.totalSupply()
		const totalSupplyToken1 = await token1.totalSupply()
		expect(await token0.balanceOf(wallet.address)).to.eq(totalSupplyToken0.sub(token0Amount).sub(swapAmount))
		expect(await token1.balanceOf(wallet.address)).to.eq(totalSupplyToken1.sub(token1Amount).add(expectedOutputAmount))
	})

	it('swap:token1', async () => {
		const token0Amount = isToken0HTS ? expandTo8Decimals(5) : expandTo18Decimals(5);
		const token1Amount = isToken1HTS ? expandTo8Decimals(10): expandTo18Decimals(10);
		await addLiquidity(token0Amount, token1Amount);

		const swapAmount = isToken1HTS ? expandTo8Decimals(1) : expandTo18Decimals(1);
		const expectedOutputAmount = hethers.BigNumber.from('45330544');
		await token1.transfer(pair.address, swapAmount);
		(await expectTx(pair.swap(expectedOutputAmount, 0, wallet.address, '0x')))
			.toEmitted(token0, 'Transfer')
			.withArgs(undefined, getAddress(wallet.address), expectedOutputAmount)
			.toEmitted(pair, 'Sync')
			.withArgs(token0Amount.sub(expectedOutputAmount), token1Amount.add(swapAmount))
			.toEmitted(pair, 'Swap')
			.withArgs(getAddress(wallet.address), 0, swapAmount, expectedOutputAmount, 0, getAddress(wallet.address))

		const reserves = await pair.getReserves()
		expect(reserves[0]).to.eq(token0Amount.sub(expectedOutputAmount))
		expect(reserves[1]).to.eq(token1Amount.add(swapAmount))
		expect(await token0.balanceOf(pair.address)).to.eq(token0Amount.sub(expectedOutputAmount))
		expect(await token1.balanceOf(pair.address)).to.eq(token1Amount.add(swapAmount))
		const totalSupplyToken0 = await token0.totalSupply()
		const totalSupplyToken1 = await token1.totalSupply()
		expect(await token0.balanceOf(wallet.address)).to.eq(totalSupplyToken0.sub(token0Amount).add(expectedOutputAmount))
		expect(await token1.balanceOf(wallet.address)).to.eq(totalSupplyToken1.sub(token1Amount).sub(swapAmount))
	})

	it('burn', async () => {
		const token0Amount = isToken0HTS ? expandTo8Decimals(3) : expandTo18Decimals(3);
		const token1Amount = isToken1HTS ? expandTo8Decimals(3): expandTo18Decimals(3);
		await addLiquidity(token0Amount, token1Amount);

		const expectedLiquidity = expandTo8Decimals(3);
		await pair.transfer(pair.address, expectedLiquidity.sub(MINIMUM_LIQUIDITY));
		(await expectTx(pair.burn(wallet.address)))
			.toEmitted(pair, 'Transfer')
			.withArgs(undefined, hethers.constants.AddressZero, expectedLiquidity.sub(MINIMUM_LIQUIDITY))
			.toEmitted(token0, 'Transfer')
			.withArgs(undefined, getAddress(wallet.address), token0Amount.sub(1000))
			.toEmitted(token1, 'Transfer')
			.withArgs(undefined, getAddress(wallet.address), token1Amount.sub(1000))
			.toEmitted(pair, 'Sync')
			.withArgs(1000, 1000)
			.toEmitted(pair, 'Burn')
			.withArgs(getAddress(wallet.address), token0Amount.sub(1000), token1Amount.sub(1000), getAddress(wallet.address));

		expect(await pair.balanceOf(wallet.address)).to.eq(0)
		expect(await pair.totalSupply()).to.eq(MINIMUM_LIQUIDITY)
		expect(await token0.balanceOf(pair.address)).to.eq(1000)
		expect(await token1.balanceOf(pair.address)).to.eq(1000)
		const totalSupplyToken0 = await token0.totalSupply()
		const totalSupplyToken1 = await token1.totalSupply()
		expect(await token0.balanceOf(wallet.address)).to.eq(totalSupplyToken0.sub(1000))
		expect(await token1.balanceOf(wallet.address)).to.eq(totalSupplyToken1.sub(1000))
	})

	it('feeTo:off', async () => {
		const token0Amount = isToken0HTS ? expandTo8Decimals(1000) : expandTo18Decimals(1000);
		const token1Amount = isToken1HTS ? expandTo8Decimals(1000): expandTo18Decimals(1000);
		await addLiquidity(token0Amount, token1Amount);

		const swapAmount = isToken0HTS ? expandTo8Decimals(1) : expandTo18Decimals(1);
		const expectedOutputAmount = hethers.BigNumber.from('99600698')
		await token1.transfer(pair.address, swapAmount)
		await pair.swap(expectedOutputAmount, 0, wallet.address, '0x')

		const expectedLiquidity = expandTo8Decimals(1000)
		await pair.transfer(pair.address, expectedLiquidity.sub(MINIMUM_LIQUIDITY))
		await pair.burn(wallet.address)
		expect(await pair.totalSupply()).to.eq(MINIMUM_LIQUIDITY)
	})

	it('feeTo:on', async () => {
		await factory.setFeeTo(other.address)

		const token0Amount = isToken0HTS ? expandTo8Decimals(1000) : expandTo18Decimals(1000);
		const token1Amount = isToken1HTS ? expandTo8Decimals(1000): expandTo18Decimals(1000);
		await addLiquidity(token0Amount, token1Amount)

		const swapAmount = isToken0HTS ? expandTo8Decimals(1) : expandTo18Decimals(1);
		const expectedOutputAmount = hethers.BigNumber.from('99600698')
		await token1.transfer(pair.address, swapAmount)
		await pair.swap(expectedOutputAmount, 0, wallet.address, '0x')

		const expectedLiquidity = expandTo8Decimals(1000)
		await pair.transfer(pair.address, expectedLiquidity.sub(MINIMUM_LIQUIDITY))
		await pair.burn(wallet.address)
		expect(await pair.totalSupply()).to.eq(MINIMUM_LIQUIDITY.add('24974'))
		expect(await pair.balanceOf(other.address)).to.eq('24974')

		// using 1000 here instead of the symbolic MINIMUM_LIQUIDITY because the amounts only happen to be equal...
		// ...because the initial liquidity amounts were equal
		expect(await token0.balanceOf(pair.address)).to.eq(hethers.BigNumber.from(1000).add('24949'))
		expect(await token1.balanceOf(pair.address)).to.eq(hethers.BigNumber.from(1000).add('25000'))
	})
})

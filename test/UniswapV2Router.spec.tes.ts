import chai, {expect} from 'chai'
import {solidity} from 'ethereum-waffle'
import {
	deflatingERC20Fixture,
	factoryFixture,
	htsFixture,
	pairFixture,
	routerFixture,
	whbarFixture
} from './shared/fixtures'

import {SignerWithAddress} from "hardhat-hethers/internal/signers";
import {BigNumber, Contract, hethers} from "@hashgraph/hethers";
import hardhat from "hardhat";
import {Utils} from "../utils/utils";
import expandTo18Decimals = Utils.expandTo18Decimals;
import expectRevert = Utils.expectRevert;
import expandTo8Decimals = Utils.expandTo8Decimals;
import reduceFrom8Decimals = Utils.reduceFrom8Decimals;

const IPAIR = "contracts/core/interfaces/IUniswapV2Pair.sol:IUniswapV2Pair";

chai.use(solidity)

describe('UniswapV2Router02', function () {
	this.timeout(5 * 60 * 1000); // 5 minutes

	const feeEnabledCases = [false, true];
	feeEnabledCases.forEach((isFeeEnabled, i) => {

		describe(`is FeeEnabled - ${isFeeEnabled}`, () => {

			let wallet: SignerWithAddress;
			let router: Contract
			let factory: Contract
			let whbar: Contract

			before(async () => {
				// @ts-ignore
				[wallet] = await hardhat.hethers.getSigners();
				factory = await factoryFixture(wallet.address, isFeeEnabled);
				whbar = await whbarFixture();
				router = await routerFixture(factory, whbar);
			})

			it('quote', async () => {
				expect(await router.quote(hethers.BigNumber.from(1), hethers.BigNumber.from(100), hethers.BigNumber.from(200))).to.eq(hethers.BigNumber.from(2))
				expect(await router.quote(hethers.BigNumber.from(2), hethers.BigNumber.from(200), hethers.BigNumber.from(100))).to.eq(hethers.BigNumber.from(1))
				await expectRevert(router.quote(hethers.BigNumber.from(0), hethers.BigNumber.from(100), hethers.BigNumber.from(200)));
				await expectRevert(router.quote(hethers.BigNumber.from(1), hethers.BigNumber.from(0), hethers.BigNumber.from(200)));
				await expectRevert(router.quote(hethers.BigNumber.from(1), hethers.BigNumber.from(100), hethers.BigNumber.from(0)));
			})

			it('getAmountOut', async () => {
				expect(await router.getAmountOut(hethers.BigNumber.from(2), hethers.BigNumber.from(100), hethers.BigNumber.from(100))).to.eq(hethers.BigNumber.from(1))
				await expectRevert(router.getAmountOut(hethers.BigNumber.from(0), hethers.BigNumber.from(100), hethers.BigNumber.from(100)))
				await expectRevert(router.getAmountOut(hethers.BigNumber.from(2), hethers.BigNumber.from(0), hethers.BigNumber.from(100)))
				await expectRevert(router.getAmountOut(hethers.BigNumber.from(2), hethers.BigNumber.from(100), hethers.BigNumber.from(0)))
			})

			it('getAmountIn', async () => {
				expect(await router.getAmountIn(hethers.BigNumber.from(1), hethers.BigNumber.from(100), hethers.BigNumber.from(100))).to.eq(hethers.BigNumber.from(2))
				await expectRevert(router.getAmountIn(hethers.BigNumber.from(0), hethers.BigNumber.from(100), hethers.BigNumber.from(100)))
				await expectRevert(router.getAmountIn(hethers.BigNumber.from(1), hethers.BigNumber.from(0), hethers.BigNumber.from(100)))
				await expectRevert(router.getAmountIn(hethers.BigNumber.from(1), hethers.BigNumber.from(100), hethers.BigNumber.from(0)))
			})

			describe('', function () {

				let token0: Contract
				let token1: Contract

				before(async () => {
					const fixture = await pairFixture(factory, [true, true]);
					token0 = fixture.token0;
					token1 = fixture.token1;
					const amount = hethers.BigNumber.from(10000)

					await token0.approve(router.address, amount)
					await token1.approve(router.address, amount)
					await router.addLiquidity(
						token0.address,
						token1.address,
						amount,
						amount,
						0,
						0,
						wallet.address,
						hethers.constants.MaxUint256
					)
				})

				it('getAmountsOut', async () => {
					await expectRevert(router.getAmountsOut(hethers.BigNumber.from(2), [token0.address]));
					const path = [token0.address, token1.address]
					expect(await router.getAmountsOut(hethers.BigNumber.from(2), path)).to.deep.eq([hethers.BigNumber.from(2), hethers.BigNumber.from(1)])
				})

				it('getAmountsIn', async () => {
					await expectRevert(router.getAmountsIn(hethers.BigNumber.from(1), [token0.address]));
					const path = [token0.address, token1.address]
					expect(await router.getAmountsIn(hethers.BigNumber.from(1), path)).to.deep.eq([hethers.BigNumber.from(2), hethers.BigNumber.from(1)])
				})

			});

			describe('fee-on-transfer tokens', () => {

				const testCases = [true, false]; // One HTS and one ERC20
				testCases.forEach((shouldBeHTS, i) => {

					describe(`is HTS - ${shouldBeHTS}`, () => {

						let token: Contract
						let pair: Contract

						beforeEach(async function () {
							token = shouldBeHTS ? await htsFixture() : await deflatingERC20Fixture();

							// make a token<>WHBAR pair
							await factory.createPair(token.address, whbar.address);
							const pairAddress = await factory.getPair(token.address, whbar.address);
							// @ts-ignore
							pair = await hardhat.hethers.getContractAt(IPAIR, pairAddress);
						})

						afterEach(async function () {
							expect(await router.balance()).to.eq(0)
						})

						async function addLiquidity(TokenAmount: BigNumber, WHBARAmount: BigNumber) {
							await token.approve(router.address, TokenAmount)
							await router.addLiquidityETH(token.address, TokenAmount, TokenAmount, WHBARAmount, wallet.address, hethers.constants.MaxUint256, {
								value: reduceFrom8Decimals(WHBARAmount)
							})
						}

						it('removeLiquidityETHSupportingFeeOnTransferTokens', async () => {
							const TokenAmount = shouldBeHTS ? expandTo8Decimals(1) : expandTo18Decimals(1)
							const HBARAmount = expandTo8Decimals(4)
							await addLiquidity(TokenAmount, HBARAmount)

							const TokenInPair = await token.balanceOf(pair.address)
							const WHBARInPair = await whbar.balanceOf(pair.address)
							const liquidity = await pair.balanceOf(wallet.address)
							const totalSupply = await pair.totalSupply()
							const NativeTokenExpected = TokenInPair.mul(liquidity).div(totalSupply)
							const WETHExpected = WHBARInPair.mul(liquidity).div(totalSupply)
							await pair.approve(router.address, hethers.constants.MaxUint256)
							await router.removeLiquidityETHSupportingFeeOnTransferTokens(
								token.address,
								liquidity,
								NativeTokenExpected,
								WETHExpected,
								wallet.address,
								hethers.constants.MaxUint256
							)
						})

						describe('swapExactTokensForTokensSupportingFeeOnTransferTokens', async () => {

							const TokenAmount = (shouldBeHTS ? expandTo8Decimals(5) : expandTo18Decimals(5))
								.mul(100)
								.div(99)
							const HbarAmount = expandTo8Decimals(10)

							beforeEach(async () => {
								await addLiquidity(TokenAmount, HbarAmount)
							})

							it('Token -> WHBAR', async () => {
								await token.approve(router.address, TokenAmount)
								const amountIn = (shouldBeHTS ? expandTo8Decimals(1) : expandTo18Decimals(1))

								await router.swapExactTokensForTokensSupportingFeeOnTransferTokens(
									amountIn,
									0,
									[token.address, whbar.address],
									wallet.address,
									hethers.constants.MaxUint256
								);
							})

							it('WHBAR -> Token', async () => {
								const amountIn = expandTo8Decimals(1);
								await whbar.deposit({value: reduceFrom8Decimals(amountIn)})
								await whbar.approve(router.address, amountIn)

								await router.swapExactTokensForTokensSupportingFeeOnTransferTokens(
									amountIn,
									0,
									[whbar.address, token.address],
									wallet.address,
									hethers.constants.MaxUint256
								);
							})
						})

						// HBAR -> Token
						it('swapExactETHForTokensSupportingFeeOnTransferTokens', async () => {
							const tokenAmount = (shouldBeHTS ? expandTo8Decimals(5) : expandTo18Decimals(5))
								.mul(100)
								.div(99)
							const hbarAmount = expandTo8Decimals(5)
							const swapAmount = 1
							await addLiquidity(tokenAmount, hbarAmount)

							await router.swapExactETHForTokensSupportingFeeOnTransferTokens(
								0,
								[whbar.address, token.address],
								wallet.address,
								hethers.constants.MaxUint256,
								{
									value: swapAmount
								}
							)
						})

						// Token -> HBAR
						it('swapExactTokensForETHSupportingFeeOnTransferTokens', async () => {
							const tokenAmount = (shouldBeHTS ? expandTo8Decimals(5) : expandTo18Decimals(5))
								.mul(100)
								.div(99)
							const hbarAmount = expandTo8Decimals(10)
							const swapAmount = (shouldBeHTS ? expandTo8Decimals(1) : expandTo18Decimals(1))

							await addLiquidity(tokenAmount, hbarAmount)
							await token.approve(router.address, swapAmount)

							await router.swapExactTokensForETHSupportingFeeOnTransferTokens(
								swapAmount,
								0,
								[token.address, whbar.address],
								wallet.address,
								hethers.constants.MaxUint256
							)
						})

					})
				})
			})

			describe('fee-on-transfer tokens: reloaded', () => {

				const testCases = [
					[true, true], // HTS / HTS Pair
					[true, false], // HTS / ERC20
					[false, false], // ERC20 / ERC20
					[false, true], // ERC20  / HTS Pair
				];
				testCases.forEach((shouldBeHTS, i) => {

					describe(`is HTS - ${shouldBeHTS}`, () => {

						let token0: Contract
						let token1: Contract
						let pair: Contract

						beforeEach(async function () {
							token0 = shouldBeHTS[0] ? await htsFixture() : await deflatingERC20Fixture();
							token1 = shouldBeHTS[1] ? await htsFixture() : await deflatingERC20Fixture();

							await factory.createPair(token0.address, token1.address);
							const pairAddress = await factory.getPair(token0.address, token1.address);
							// @ts-ignore
							pair = await hardhat.hethers.getContractAt(IPAIR, pairAddress);
						})

						afterEach(async function () {
							expect(await router.balance()).to.eq(0)
							expect(await token0.balanceOf(router.address)).to.eq(0)
							expect(await token1.balanceOf(router.address)).to.eq(0)
						})

						async function addLiquidity(token0Amount: BigNumber, token1Amount: BigNumber) {
							await token0.approve(router.address, token0Amount)
							await token1.approve(router.address, token1Amount)
							await router.addLiquidity(
								token0.address,
								token1.address,
								token0Amount,
								token1Amount,
								token0Amount,
								token1Amount,
								wallet.address,
								hethers.constants.MaxUint256
							)
						}

						it('Token0 -> Token1', async () => {
							const token0Amount = (shouldBeHTS[0] ? expandTo8Decimals(5) : expandTo18Decimals(5))
								.mul(100)
								.div(99)
							const token1Amount = (shouldBeHTS[1] ? expandTo8Decimals(5) : expandTo18Decimals(5))
							const amountIn = (shouldBeHTS[0] ? expandTo8Decimals(1) : expandTo18Decimals(1))

							await addLiquidity(token0Amount, token1Amount)
							await token0.approve(router.address, token0Amount)
							await router.swapExactTokensForTokensSupportingFeeOnTransferTokens(
								amountIn,
								0,
								[token0.address, token1.address],
								wallet.address,
								hethers.constants.MaxUint256
							)
						})
					})
				});
			});

		})

	})

})


import chai, {expect} from 'chai'
import {solidity} from 'ethereum-waffle'
import {
	deflatingERC20Fixture, erc20Fixture,
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
import expectTx from "../utils/LogAssertion";
import expandTo18Decimals = Utils.expandTo18Decimals;
import expectRevert = Utils.expectRevert;
import expandTo8Decimals = Utils.expandTo8Decimals;
import reduceFrom8Decimals = Utils.reduceFrom8Decimals;
import MINIMUM_LIQUIDITY = Utils.MINIMUM_LIQUIDITY;
import expandTo13Decimals = Utils.expandTo13Decimals;
import exp from "constants";

const IPAIR = "contracts/core/interfaces/IUniswapV2Pair.sol:IUniswapV2Pair";

chai.use(solidity)

// TODO Add tests for HTS with custom fees

describe('UniswapV2Router02', function () {
	this.timeout(5 * 60 * 1000); // 5 minutes

	const feeEnabledCases = [true, false];
	feeEnabledCases.forEach((isFeeEnabled, i) => {

		describe(`is FeeEnabled - ${isFeeEnabled}`, () => {

			let wallet: SignerWithAddress;
			let router: Contract
			let factory: Contract
			let whbar: Contract

			before(async () => {
				// @ts-ignore
				[wallet] = await hardhat.hethers.getSigners();
				// factory = await factoryFixture(wallet.address, isFeeEnabled);
				// @ts-ignore
				factory = await hardhat.hethers.getContractAt("UniswapV2Factory", '0x0000000000000000000000000000000002cacb4c');
				// whbar = await whbarFixture();
				// @ts-ignore
				whbar = await hardhat.hethers.getContractAt("MockWHBAR", '0x0000000000000000000000000000000002cacb4e');
				// @ts-ignore
				router = await hardhat.hethers.getContractAt("UniswapV2Router02", '0x0000000000000000000000000000000002cacb50');
				// router = await routerFixture(factory, whbar);
			})

			it('factory, WHBAR', async () => {
				expect(await router.factory()).to.eq(hethers.utils.getAddress(factory.address));
				expect(await router.WHBAR()).to.eq(hethers.utils.getAddress(whbar.address));
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

			describe('operations with Token / HBAR pairs', () => {

				const testCases = [true, false]; // One HTS and one ERC20
				testCases.forEach((shouldBeHTS, i) => {

					describe(`is HTS - ${shouldBeHTS}`, () => {

						let token: Contract
						let pair: Contract

						beforeEach(async function () {
							token = shouldBeHTS ? await htsFixture() : await erc20Fixture();

							// make a token<>WHBAR pair
							await factory.createPair(token.address, whbar.address);
							const pairAddress = await factory.getPair(token.address, whbar.address);
							// @ts-ignore
							pair = await hardhat.hethers.getContractAt(IPAIR, pairAddress);
						})

						afterEach(async function () {
							expect(await router.balance()).to.eq(0)
						})

						it('addLiquidityETH', async () => {
							const tokenAmount = shouldBeHTS ? expandTo8Decimals(1) : expandTo18Decimals(1);
							const hbarAmount = expandTo8Decimals(4);

							const expectedLiquidity = shouldBeHTS ? expandTo8Decimals(2) : expandTo13Decimals(2);
							const whbarPairToken = await pair.token0();
							await token.approve(router.address, tokenAmount);

							(await expectTx(
								router.addLiquidityETH(
									token.address,
									tokenAmount,
									tokenAmount,
									hbarAmount,
									wallet.address,
									hethers.constants.MaxUint256,
									{value: reduceFrom8Decimals(hbarAmount)}
								)
							))
								.toEmitted(pair, 'Transfer')
								.withArgs(hethers.constants.AddressZero, hethers.constants.AddressZero, MINIMUM_LIQUIDITY)
								.toEmitted(pair, 'Transfer')
								.withArgs(hethers.constants.AddressZero, wallet.address, expectedLiquidity.sub(MINIMUM_LIQUIDITY))
								.toEmitted(pair, 'Sync')
								.withArgs(
									hethers.utils.getAddress(whbarPairToken) === hethers.utils.getAddress(pair.address) ? tokenAmount : hbarAmount,
									hethers.utils.getAddress(whbarPairToken) === hethers.utils.getAddress(pair.address) ? hbarAmount : tokenAmount
								)
								.toEmitted(pair, 'Mint')
								.withArgs(
									hethers.utils.getAddress(router.address),
									hethers.utils.getAddress(whbarPairToken) === hethers.utils.getAddress(pair.address) ? tokenAmount : hbarAmount,
									hethers.utils.getAddress(whbarPairToken) === hethers.utils.getAddress(pair.address) ? hbarAmount : tokenAmount
								)

							expect(await pair.balanceOf(wallet.address)).to.eq(expectedLiquidity.sub(MINIMUM_LIQUIDITY))
						})

						async function addLiquidity(TokenAmount: BigNumber, WHBARAmount: BigNumber) {
							await token.approve(router.address, TokenAmount)
							await router.addLiquidityETH(token.address, TokenAmount, TokenAmount, WHBARAmount, wallet.address, hethers.constants.MaxUint256, {
								value: reduceFrom8Decimals(WHBARAmount)
							})
						}

						it('removeLiquidityETH', async () => {
							const totalSupplyWHBARBefore = await whbar.totalSupply();
							const tokenAmount = shouldBeHTS ? expandTo8Decimals(1) : expandTo18Decimals(1);
							const whbarAmount = expandTo8Decimals(4);

							await token.transfer(pair.address, tokenAmount);
							await whbar.deposit({ value: reduceFrom8Decimals(whbarAmount) });
							await whbar.transfer(pair.address, whbarAmount);
							await pair.mint(wallet.address);

							const expectedLiquidity = shouldBeHTS ? expandTo8Decimals(2) : expandTo13Decimals(2);
							const whbarPairToken0 = await pair.token0();
							await pair.approve(router.address, hethers.constants.MaxUint256);
							const whbarSubAmount = shouldBeHTS ? 2000 : 1;
							const tokenSubAmount = shouldBeHTS ? 500 : 50000000;
							(await expectTx(
								router.removeLiquidityETH(
									token.address,
									expectedLiquidity.sub(MINIMUM_LIQUIDITY),
									0,
									0,
									wallet.address,
									hethers.constants.MaxUint256
								)
							))
								.toEmitted(pair, 'Transfer')
								// Cannot assert pair address
								.withArgs(wallet.address, undefined, expectedLiquidity.sub(MINIMUM_LIQUIDITY))
								.toEmitted(pair, 'Transfer')
								// Cannot assert pair address
								.withArgs(undefined, hethers.constants.AddressZero, expectedLiquidity.sub(MINIMUM_LIQUIDITY))
								.toEmitted(whbar, 'Transfer')
								// Cannot assert pair address
								.withArgs(undefined, hethers.utils.getAddress(router.address), whbarAmount.sub(whbarSubAmount))
								.toEmitted(token, 'Transfer')
								// 999999999950000000
								// 999999999999999500
								.withArgs(undefined, hethers.utils.getAddress(router.address), tokenAmount.sub(tokenSubAmount))
								.toEmitted(token, 'Transfer')
								.withArgs(hethers.utils.getAddress(router.address), hethers.utils.getAddress(wallet.address), tokenAmount.sub(tokenSubAmount))
								.toEmitted(pair, 'Sync')
								.withArgs(
									whbarPairToken0 === token.address ? tokenSubAmount : whbarSubAmount,
									whbarPairToken0 === token.address ? whbarSubAmount : tokenSubAmount
								)
								.toEmitted(pair, 'Burn')
								.withArgs(
									hethers.utils.getAddress(router.address),
									whbarPairToken0 === token.address ? tokenAmount.sub(tokenSubAmount) : whbarAmount.sub(whbarSubAmount),
									whbarPairToken0 === token.address ? whbarAmount.sub(whbarSubAmount) : tokenAmount.sub(tokenSubAmount),
									hethers.utils.getAddress(router.address)
								)

							expect(await pair.balanceOf(wallet.address)).to.eq(0)
							const totalSupplyToken = await token.totalSupply()
							const totalSupplyWHBAR = await whbar.totalSupply()
							expect(await token.balanceOf(wallet.address)).to.eq(totalSupplyToken.sub(tokenSubAmount))
							expect(await whbar.balanceOf(wallet.address)).to.eq(totalSupplyWHBAR.sub(whbarSubAmount).sub(totalSupplyWHBARBefore))
						})

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
							const tx = await router.removeLiquidityETHSupportingFeeOnTransferTokens(
								token.address,
								liquidity,
								NativeTokenExpected,
								WETHExpected,
								wallet.address,
								hethers.constants.MaxUint256
							)
							await tx.wait();
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

								const tx = await router.swapExactTokensForTokensSupportingFeeOnTransferTokens(
									amountIn,
									0,
									[token.address, whbar.address],
									wallet.address,
									hethers.constants.MaxUint256
								);
								tx.wait();
							})

							it('WHBAR -> Token', async () => {
								const amountIn = expandTo8Decimals(1);
								await whbar.deposit({value: reduceFrom8Decimals(amountIn)})
								await whbar.approve(router.address, amountIn)

								const tx = await router.swapExactTokensForTokensSupportingFeeOnTransferTokens(
									amountIn,
									0,
									[whbar.address, token.address],
									wallet.address,
									hethers.constants.MaxUint256
								);
								await tx.wait();
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

							const tx = await router.swapExactETHForTokensSupportingFeeOnTransferTokens(
								0,
								[whbar.address, token.address],
								wallet.address,
								hethers.constants.MaxUint256,
								{
									value: swapAmount
								}
							)
							tx.wait();
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

							const tx = await router.swapExactTokensForETHSupportingFeeOnTransferTokens(
								swapAmount,
								0,
								[token.address, whbar.address],
								wallet.address,
								hethers.constants.MaxUint256
							);
							await tx.wait();
						})

					})
				})
			})

			describe('Operations with different token combinations', () => {

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
							token0 = shouldBeHTS[0] ? await htsFixture() : await erc20Fixture();
							token1 = shouldBeHTS[1] ? await htsFixture() : await erc20Fixture();

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

						it('addLiquidity', async () => {
							const token0Amount = shouldBeHTS[0] ? expandTo8Decimals(1) : expandTo18Decimals(1);
							const token1Amount = shouldBeHTS[1] ? expandTo8Decimals(4) : expandTo18Decimals(4);

							let expectedLiquidity;
							if (shouldBeHTS[0] && shouldBeHTS[1]) {
								expectedLiquidity = expandTo8Decimals(2); // both HTS
							} else if (!shouldBeHTS[0] && !shouldBeHTS[1]) {
								expectedLiquidity = expandTo18Decimals(2); // both ERC20
							} else {
								expectedLiquidity = expandTo13Decimals(2); // HTS/ERC20 combination
							}

							await token0.approve(router.address, token0Amount);
							await token1.approve(router.address, token1Amount);
							(await expectTx(
								router.addLiquidity(
									token0.address,
									token1.address,
									token0Amount,
									token1Amount,
									0,
									0,
									wallet.address,
									hethers.constants.MaxUint256
								)
							))
								.toEmitted(token0, 'Transfer')
								// Pair address cannot be asserted
								.withArgs(hethers.utils.getAddress(wallet.address), undefined, token0Amount)
								.toEmitted(token1, 'Transfer')
								// Pair address cannot be asserted
								.withArgs(hethers.utils.getAddress(wallet.address), undefined, token1Amount)
								.toEmitted(pair, 'Transfer')
								.withArgs(hethers.constants.AddressZero, hethers.constants.AddressZero, MINIMUM_LIQUIDITY)
								.toEmitted(pair, 'Transfer')
								.withArgs(hethers.constants.AddressZero, hethers.utils.getAddress(wallet.address), expectedLiquidity.sub(MINIMUM_LIQUIDITY))
								.toEmitted(pair, 'Sync')
								.withArgs(token0Amount, token1Amount)
								.toEmitted(pair, 'Mint')
								.withArgs(hethers.utils.getAddress(router.address), token0Amount, token1Amount)

							expect(await pair.balanceOf(wallet.address)).to.eq(expectedLiquidity.sub(MINIMUM_LIQUIDITY))
						})

						async function addLiquidity(token0Amount: BigNumber, token1Amount: BigNumber) {
							await token0.approve(router.address, token0Amount)
							await token1.approve(router.address, token1Amount)
							const tx = await router.addLiquidity(
								token0.address,
								token1.address,
								token0Amount,
								token1Amount,
								token0Amount,
								token1Amount,
								wallet.address,
								hethers.constants.MaxUint256
							);
							await tx.wait();
						}

						it('Token0 -> Token1', async () => {
							const token0Amount = (shouldBeHTS[0] ? expandTo8Decimals(5) : expandTo18Decimals(5))
								.mul(100)
								.div(99)
							const token1Amount = (shouldBeHTS[1] ? expandTo8Decimals(5) : expandTo18Decimals(5))
							const amountIn = (shouldBeHTS[0] ? expandTo8Decimals(1) : expandTo18Decimals(1))

							await addLiquidity(token0Amount, token1Amount)
							await token0.approve(router.address, token0Amount)
							const tx = await router.swapExactTokensForTokensSupportingFeeOnTransferTokens(
								amountIn,
								0,
								[token0.address, token1.address],
								wallet.address,
								hethers.constants.MaxUint256
							)
							await tx.wait();
						})

						it('removeLiquidity', async () => {
							const token0Amount = (shouldBeHTS[0] ? expandTo8Decimals(1) : expandTo18Decimals(1));
							const token1Amount = (shouldBeHTS[1] ? expandTo8Decimals(4) : expandTo18Decimals(4));
							await addLiquidity(token0Amount, token1Amount);

							let expectedLiquidity;
							let token0SubAmount;
							let token1SubAmount;
							if (shouldBeHTS[0] && shouldBeHTS[1]) {
								expectedLiquidity = expandTo8Decimals(2); // both HTS
								token0SubAmount = 500;
								token1SubAmount = 2000;
							} else if (!shouldBeHTS[0] && !shouldBeHTS[1]) {
								expectedLiquidity = expandTo18Decimals(2); // both ERC20
								token0SubAmount = 500;
								token1SubAmount = 2000;
							} else {
								expectedLiquidity = expandTo13Decimals(2); // HTS/ERC20 combination
								if (shouldBeHTS[0]) {
									token0SubAmount = 1;
									token1SubAmount = 200000000;
								} else {
									token0SubAmount = 50000000;
									token1SubAmount = 1;
								}
							}
							await pair.approve(router.address, hethers.constants.MaxUint256);

							(await expectTx(
								router.removeLiquidity(
									token0.address,
									token1.address,
									expectedLiquidity.sub(MINIMUM_LIQUIDITY),
									0,
									0,
									wallet.address,
									hethers.constants.MaxUint256
								)
							))
								.toEmitted(pair, 'Transfer')
								.withArgs(hethers.utils.getAddress(wallet.address), undefined, expectedLiquidity.sub(MINIMUM_LIQUIDITY))
								.toEmitted(pair, 'Transfer')
								.withArgs(undefined, hethers.constants.AddressZero, expectedLiquidity.sub(MINIMUM_LIQUIDITY))
								.toEmitted(token0, 'Transfer')
								.withArgs(undefined, hethers.utils.getAddress(wallet.address), token0Amount.sub(token0SubAmount))
								.toEmitted(token1, 'Transfer')
								.withArgs(undefined, hethers.utils.getAddress(wallet.address), token1Amount.sub(token1SubAmount))
								.toEmitted(pair, 'Sync')
								.withArgs(token0SubAmount, token1SubAmount)
								.toEmitted(pair, 'Burn')
								.withArgs(undefined, token0Amount.sub(token0SubAmount), token1Amount.sub(token1SubAmount), hethers.utils.getAddress(wallet.address))

							expect(await pair.balanceOf(wallet.address)).to.eq(0)
							const totalSupplyToken0 = await token0.totalSupply()
							const totalSupplyToken1 = await token1.totalSupply()
							expect(await token0.balanceOf(wallet.address)).to.eq(totalSupplyToken0.sub(token0SubAmount))
							expect(await token1.balanceOf(wallet.address)).to.eq(totalSupplyToken1.sub(token1SubAmount))
						})
					})
				});
			});
		})
	})
})


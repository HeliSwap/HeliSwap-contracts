// @ts-nocheck
import hardhat from "hardhat";
import { Utils } from "../../utils/utils";
import getExpiry = Utils.getExpiry;

async function addLiquidityHbar(
  wrapperAddress: string,
  token0: string,
  amount0: string,
  hbarAmount: string
) {
  const [signer] = await hardhat.hethers.getSigners();
  const wrapper = await hardhat.hethers.getContractAt(
    "UniswapV2Router02Wrapper",
    wrapperAddress
  );
  const whbarAddress = await wrapper.WHBAR();
  console.log(`Adding Liquidity to ${token0}/${whbarAddress}...`);

  const addLiquidityTx = await wrapper.addLiquidityHBAR(
    token0,
    amount0,
    amount0,
    hbarAmount,
    signer.address,
    getExpiry(),
    { value: hbarAmount, gasLimit: 6_000_000 }
  );
  const txReceipt = await addLiquidityTx.wait();
  console.log(`Added Liquidity: ${txReceipt.transactionHash}`);

  //   const router = await wrapper.router();
  //   const reserves = await router.getReserves(token0, whbarAddress);
  //   console.log(`Reserves: ${reserves}`);
}

module.exports = addLiquidityHbar;

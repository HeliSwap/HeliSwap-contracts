// @ts-nocheck
import hardhat from "hardhat";

async function deployWrapper(whbar: string, router: string) {
  console.log(`Deploying HeliSwap Router Wrapper...`);
  const HeliSwapRouterWrappper = await hardhat.hethers.getContractFactory(
    "UniswapV2Router02Wrapper"
  );
  const wrapper = await HeliSwapRouterWrappper.deploy(router, whbar);
  await wrapper.deployed();

  console.log(`HeliSwap Router Address: ${wrapper.address}`);

  return { wrapper };
}

module.exports = deployWrapper;

// @ts-nocheck
import hardhat from "hardhat";

async function deployRouter(whbar: string, factory: string) {
  console.log(`Deploying HeliSwap Router...`);
  const HeliSwapRouter = await hardhat.hethers.getContractFactory(
    "UniswapV2Router02"
  );
  const router = await HeliSwapRouter.deploy(factory, whbar);
  await router.deployed();

  console.log(`HeliSwap Router Address: ${router.address}`);

  return { router };
}

module.exports = deployRouter;

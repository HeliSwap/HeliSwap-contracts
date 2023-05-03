// @ts-nocheck
import hardhat from "hardhat";
const deploy = require("./deploy");
const deployWrapper = require("./deployWrapper");
const deployRouter = require("./deployRouter");
const addLiquidity = require("./interactions/add-liquidity");
const addLiquidityHbar = require("./interactions/add-liquidity-hbar");
const addLiquidityHbarWrapper = require("./interactions/add-liquidity-hbar-wrapper");
const approve = require("./utilities/erc20-approve");

async function wrapper() {
  const WHBARAddress = "0x0000000000000000000000000000000000001c3D";
  const WHBARAddressNew = "0x00000000000000000000000000000000003c08e3";

  const WETHAddress = "0x0000000000000000000000000000000000002020";
  const WBTCAddress = "0x0000000000000000000000000000000000002016";
  const USDCAddress = "0x0000000000000000000000000000000000001fFF";

  const feeToSetter = "0x0000000000000000000000000000000002099e42";

  // Deploy factory and router
  console.log("⚙️ Deploying factory and router...");
  const { router, factory } = await deploy(WHBARAddress, feeToSetter);
  console.log("✅ Router address", router.address);
  console.log("✅ Factory address", factory.address);

  // Approve USDC token
  console.log("⚙️ Approving tokens...");
  await approve(USDCAddress, router.address, 1000000_000_000);
  await approve(WETHAddress, router.address, 1000000_000_000);
  await approve(WBTCAddress, router.address, 1000000_000_000);
  const routerAddress = router.address;
  const factoryAddress = factory.address;
  console.log("✅ Tokens approved");

  // const routerAddress = "0x00000000000000000000000000000000003dc808";

  // Create HBAR/USD pool
  console.log("⚙️ Creating HBAR/USD pool...");
  await addLiquidityHbar(routerAddress, USDCAddress, "620000", "10");
  console.log("✅ HBAR/USD pool created");

  // Create USD/WBTC pool
  console.log("⚙️ Creating USD/WBTC pool...");
  await addLiquidity(
    routerAddress,
    USDCAddress,
    "100000000",
    WBTCAddress,
    "260000"
  );
  console.log("✅ USD/WBTC pool created");

  // Deploy wrapper
  console.log("⚙️ Deploying a wrapper...");
  // const { wrapper } = await deployWrapper(WHBARAddressNew, routerAddress);
  // const wrapperAddress = wrapper.address;
  const { router: newRouter } = await deployRouter(
    WHBARAddressNew,
    factoryAddress
  );
  console.log("✅ Wrapper deployed");

  const wrapperAddress = newRouter.address;
  // const wrapperAddress = "0x00000000000000000000000000000000003de02a";

  // Approve USDC token
  console.log("⚙️ Approving tokens...");
  await approve(USDCAddress, wrapperAddress, 1000000_000_000);
  await approve(WETHAddress, wrapperAddress, 1000000_000_000);
  await approve(WBTCAddress, wrapperAddress, 1000000_000_000);
  console.log("✅ Tokens approved");

  // Create HBAR/USD pool with new wrapper
  console.log("⚙️ Creating pool with wrapper...");
  // await addLiquidityHbarWrapper(wrapperAddress, USDCAddress, "620000", "10");
  await addLiquidityHbar(wrapperAddress, USDCAddress, "620000", "10");
  console.log("✅ Liquidity added");

  // Swap
  // Remove liquidity
}

module.exports = wrapper;

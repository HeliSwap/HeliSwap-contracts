// @ts-nocheck
import hardhat from "hardhat";

const deploy = require("./deploy");
const addLiquidity = require("./interactions/add-liquidity");
const addLiquidityHbar = require("./interactions/add-liquidity-hbar");
const approve = require("./utilities/erc20-approve");

async function setupDex() {
  const WHBARAddress = "0x0000000000000000000000000000000000001c3D";

  const USDCAddress = "0x0000000000000000000000000000000000001fFF";
  const WETHAddress = "0x0000000000000000000000000000000000002020";
  const WBTCAddress = "0x0000000000000000000000000000000000002016";

  const feeToSetter = "0x0000000000000000000000000000000002099e42";

  // Deploy factory and router
  console.log("⚙️ Deploying factory and router...");
  const { router, factory } = await deploy(WHBARAddress, feeToSetter);
  console.log("✅ Factory address", factory.address);
  console.log("✅ Router address", router.address);

  const routerAddress = router.address;
  const factoryAddress = factory.address;

  // Approve tokens
  console.log("⚙️ Approving tokens...");
  await approve(USDCAddress, router.address, 1000000_000_000);
  await approve(WETHAddress, router.address, 1000000_000_000);
  await approve(WBTCAddress, router.address, 1000000_000_000);
  console.log("✅ Tokens approved");

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
}

module.exports = setupDex;

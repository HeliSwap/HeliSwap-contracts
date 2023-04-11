// @ts-nocheck
import hardhat from "hardhat";
const deploy = require("./deploy");
const deployWrapper = require("./deployWrapper");
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
  const { router } = await deploy(WHBARAddress, feeToSetter);
  console.log("✅ Router address", router.address);

  // Approve USDC token
  console.log("⚙️ Approving token...");
  await approve(USDCAddress, router.address, 100000000);
  const routerAddress = router.address;
  console.log("✅ Token approved");

  // const routerAddress = "0x00000000000000000000000000000000003dc808";

  // Create HBAR/USD pool
  console.log("⚙️ Creating pool...");
  await addLiquidityHbar(routerAddress, USDCAddress, "66000000", "100");
  console.log("✅ Liquidity added");

  // Deploy wrapper
  console.log("⚙️ Deploying a wrapper...");
  const { wrapper } = await deployWrapper(WHBARAddressNew, routerAddress);
  const wrapperAddress = wrapper.address;
  console.log("✅ Wrapper deployed");

  // const wrapperAddress = "0x00000000000000000000000000000000003dc840";

  // Approve USDC token
  console.log("⚙️ Approving token...");
  await approve(USDCAddress, wrapperAddress, 100000000);
  console.log("✅ Token approved");

  // Create HBAR/USD pool with new wrapper
  console.log("⚙️ Creating pool with wrapper...");
  await addLiquidityHbarWrapper(wrapperAddress, USDCAddress, "66000000", "100");
  console.log("✅ Liquidity added");

  // Swap
  // Remove liquidity
}

module.exports = wrapper;

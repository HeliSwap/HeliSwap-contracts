// @ts-nocheck
import hardhat from "hardhat";

const deployRouter = require("./deployRouter");
const addLiquidityHbar = require("./interactions/add-liquidity-hbar");
const approve = require("./utilities/erc20-approve");

async function setupDexNewRouter(factoryAddress: string) {
  const WHBARAddressNew = "0x00000000000000000000000000000000003c08e3";
  const USDCAddress = "0x0000000000000000000000000000000000001fFF";
  const HELIAddress = "0x0000000000000000000000000000000000002023";

  // Deploy wrapper
  console.log("⚙️ Deploying a new router...");
  const { router } = await deployRouter(WHBARAddressNew, factoryAddress);
  console.log("✅ Router deployed");

  // Approve tokens
  console.log("⚙️ Approving tokens...");
  await approve(USDCAddress, router.address, 1000000_000_000);
  await approve(HELIAddress, router.address, 1000000_000_000_00);
  console.log("✅ Tokens approved");

  // Create HBAR/USD pool
  console.log("⚙️ Creating HBAR/USD pool...");
  await addLiquidityHbar(router.address, USDCAddress, "5400000", "100");
  console.log("✅ HBAR/USD pool created");

  // Create HBAR/HELI pool
  console.log("⚙️ Creating HBAR/HELI pool...");
  await addLiquidityHbar(router.address, HELIAddress, "42300000000", "100");
  console.log("✅ HBAR/HELI pool created");
}

module.exports = setupDexNewRouter;

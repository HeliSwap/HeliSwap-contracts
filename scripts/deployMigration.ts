// @ts-nocheck
import hardhat from "hardhat";

async function deployMigration(oldRouter: string, newRouter: string) {
  console.log(`Deploying HeliSwap Migration contract...`);
  const HeliSwapMigration = await hardhat.hethers.getContractFactory(
    "Migration"
  );
  const migration = await HeliSwapMigration.deploy(oldRouter, newRouter);
  await migration.deployed();

  console.log(`HeliSwap Migration contract Address: ${migration.address}`);
}

module.exports = deployMigration;

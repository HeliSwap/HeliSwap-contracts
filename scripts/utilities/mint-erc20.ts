// @ts-nocheck
import hardhat from 'hardhat';

async function mintERC20(tokenAddress: string, to: string, amount: string = "1000000000000000000000") {
    console.log(`Starting ERC20 deployment...`);

    const MockToken = await hardhat.hethers.getContractAt("MockToken", tokenAddress);
    const mockToken = await MockToken.mint(to, amount);
    // await mockToken.deployed();
    console.log(`${amount} of Mock Token ${tokenAddress} Minted to ${to}`);
}

module.exports = mintERC20;

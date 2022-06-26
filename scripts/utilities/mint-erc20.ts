// @ts-nocheck
import hardhat from 'hardhat';

async function mintERC20(tokenAddress: string, to: string, amount: string = "6000000000000000000000") {
    console.log(`Minting ERC20 supply...`);

    const MockToken = await hardhat.hethers.getContractAt("MockToken", tokenAddress);
    const mockToken = await MockToken.mint(to, amount);
    await mockToken.wait();
    console.log(`${amount} of Mock Token ${tokenAddress} Minted to ${to}`);
}

module.exports = mintERC20;

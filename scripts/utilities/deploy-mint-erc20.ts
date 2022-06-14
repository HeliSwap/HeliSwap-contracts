// @ts-nocheck
import deployERC20 from './deploy-erc20';
import mintERC20 from './mint-erc20';

async function deployMintERC20(to: string, amount: string) {
    let tokenAddress = await deployERC20("Token", "t");
    await mintERC20(tokenAddress, to, amount);
}

module.exports = deployMintERC20;

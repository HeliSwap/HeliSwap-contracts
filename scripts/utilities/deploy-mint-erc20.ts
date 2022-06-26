// @ts-nocheck
import deployERC20 from './deploy-erc20';
import mintERC20 from './mint-erc20';

async function deployMintERC20(to: string, amount: string, name = "Token", symbol = "t") {
    let tokenAddress = await deployERC20(name, symbol);
    await mintERC20(tokenAddress, to, amount);
    return tokenAddress;
}

module.exports = deployMintERC20;

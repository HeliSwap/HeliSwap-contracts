// @ts-nocheck
import fs from "fs";
import hardhat from 'hardhat';

async function swap(router, token1EVMAddress, token2EVMAddress) {
    const today = new Date();
    const oneHourAfter = new Date();
    oneHourAfter.setHours(today.getHours() + 1);
    const gasLimitOverride = {gasLimit: 3000000};

    const _uniswapV2RouterAbi = JSON.parse(fs.readFileSync('assets/UniswapV2Router.abi.json').toString());

    let signers = await hardhat.hethers.getSigners();
    let signer = signers[1]._signer;

    let reconnectedRouter = hethers.ContractFactory.getContract(router, _uniswapV2RouterAbi, signer);
    const swapTx = await reconnectedRouter.swapExactTokensForTokens(
        500,
        400,
        [token1EVMAddress, token2EVMAddress],
        signers[2]._signer.address,
        oneHourAfter.getTime(),
        gasLimitOverride);
    console.log('Waiting for swapTx');
    console.log(swapTx)

    const reserves = await reconnectedRouter.getReserves(
        token1EVMAddress,
        token2EVMAddress,
        gasLimitOverride
    );

    return reserves
}

module.exports = swap;

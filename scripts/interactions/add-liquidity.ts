// @ts-nocheck
import fs from "fs";
import hardhat from 'hardhat';

async function addLiquidity(router, token1EVMAddress, token2EVMAddress) {
    const today = new Date();
    const oneHourAfter = new Date();
    oneHourAfter.setHours(today.getHours() + 1);

    const gasLimitOverride = {gasLimit: 3000000};

    const _uniswapV2RouterAbi = JSON.parse(fs.readFileSync('assets/UniswapV2Router.abi.json').toString());

    let signers = await hardhat.hethers.getSigners();
    let signer = signers[0]._signer;

    let reconnectedRouter = hethers.ContractFactory.getContract(router, _uniswapV2RouterAbi, signer);
    const liquidityAddTx = await reconnectedRouter.addLiquidity(
        token1EVMAddress,
        token2EVMAddress,
        100000000000,
        100000000000,
        100000000000,
        100000000000,
        signer.address,
        oneHourAfter.getTime(),
        gasLimitOverride);
    console.log(liquidityAddTx)

    const reserves = await reconnectedRouter.getReserves(
        token1EVMAddress,
        token2EVMAddress,
        gasLimitOverride
    );

    return reserves
}

module.exports = addLiquidity;

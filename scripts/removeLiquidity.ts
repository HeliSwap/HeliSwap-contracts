// @ts-nocheck
import fs from "fs";
import hardhat from 'hardhat';
import * as util from "util";

async function addLiquidity(router, token1EVMAddress, token2EVMAddress) {
    const today = new Date();
    const oneHourAfter = new Date();
    oneHourAfter.setHours(today.getHours() + 1);

    const gasLimitOverride = {gasLimit: 3000000};

    const _uniswapV2RouterAbi = JSON.parse(fs.readFileSync('assets/UniswapV2Router.abi.json').toString());

    let signers = await hardhat.hethers.getSigners();
    let signer = signers[0]._signer;
    const amount = 100000000000;
    let reconnectedRouter = hethers.ContractFactory.getContract(router, _uniswapV2RouterAbi, signer);
    try {
        const liquidityAddTx = await reconnectedRouter.removeLiquidity(
            token1EVMAddress,
            token2EVMAddress,
            amount,
            amount,
            amount,
            signer.address,
            oneHourAfter.getTime(),
            gasLimitOverride);
        const receipt = await liquidityAddTx.wait();
        receipt.events.forEach(event => {
            console.log(util.inspect(event));
        });
    }catch (e) {
        console.log(e)
    }

    const reserves = await reconnectedRouter.getReserves(
        token1EVMAddress,
        token2EVMAddress,
        gasLimitOverride
    );

    return reserves
}

module.exports = addLiquidity;

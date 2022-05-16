// @ts-nocheck
import fs from "fs";
import hardhat from 'hardhat';
import * as util from "util";
import {Utils} from "../../utils/utils";
import getExpiry = Utils.getExpiry;

async function removeLiquidity(routerAddress, token1EVMAddress, token2EVMAddress, amount0, amount1) {
    // FIXME: This currently does not take into account passed amounts.
    const router = await hardhat.hethers.getContractAt('UniswapV2Router02', routerAddress);
    const [signer] = await hardhat.hethers.getSigners();

    const amount = 100000000;
    try {
        const liquidityAddTx = await router.removeLiquidity(
            token1EVMAddress,
            token2EVMAddress,
            amount,
            amount,
            amount,
            signer.address,
            getExpiry());
        const receipt = await liquidityAddTx.wait();
        receipt.events.forEach(event => {
            console.log(util.inspect(event));
        });
    } catch (e) {
        console.log(e)
    }
}

module.exports = removeLiquidity;

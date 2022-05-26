// @ts-nocheck
import fs from "fs";
import hardhat from 'hardhat';
import * as util from "util";
import {Utils} from "../../utils/utils";
import getExpiry = Utils.getExpiry;

async function removeLiquidity(routerAddress, token1EVMAddress, token2EVMAddress, amount0, amount1, liq) {
    const router = await hardhat.hethers.getContractAt('UniswapV2Router02', routerAddress);
    const [signer] = await hardhat.hethers.getSigners();
    try {
        const liquidityAddTx = await router.removeLiquidity(
            token1EVMAddress,
            token2EVMAddress,
            liq,
            amount0,
            amount1,
            signer.address,
            getExpiry());
        const receipt = await liquidityAddTx.wait();
        console.log(receipt);
    } catch (e) {
        console.log(e)
    }
}

module.exports = removeLiquidity;

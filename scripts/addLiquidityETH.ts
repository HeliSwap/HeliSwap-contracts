// @ts-nocheck
import fs from "fs";
import hardhat from 'hardhat';
import {hethers} from "@hashgraph/hethers";

async function addLiquidityETH(router, token1EVMAddress) {
    const today = new Date();
    const oneHourAfter = new Date();
    oneHourAfter.setHours(today.getHours() + 1);

    const _uniswapV2RouterAbi = JSON.parse(fs.readFileSync('assets/UniswapV2Router.abi.json').toString());
    const amount = 100000000;
    const [signer] = await hardhat.hethers.getSigners();
    let reconnectedRouter = hardhat.hethers.ContractFactory.getContract(router, _uniswapV2RouterAbi, signer);
    const liquidityAddTx = await reconnectedRouter.addLiquidityETH(
        token1EVMAddress,
        amount,
        amount,
        amount,
        signer.address,
        oneHourAfter.getTime(),
        {
            value: hethers.BigNumber.from(hethers.utils.formatUnits(amount, 'hbar').split('.')[0]),
        }
    );
    console.log(await liquidityAddTx.wait())

    const reserves = await reconnectedRouter.getReserves(
        token1EVMAddress,
        '0x0000000000000000000000000000000002096e2f' // whbar addr
    );

    return reserves
}

module.exports = addLiquidityETH;

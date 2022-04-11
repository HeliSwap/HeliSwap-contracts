// @ts-nocheck
import fs from "fs";
import hardhat from 'hardhat';
import {hethers} from "@hashgraph/hethers";

async function createPair(factory, token1EVMAddress, token2EVMAddress) {
    const gasLimitOverride = {gasLimit: 3000000};

    const _uniswapV2FactoryAbi = JSON.parse(fs.readFileSync('assets/UniswapV2Factory.abi.json').toString());

    let signers = await hardhat.hethers.getSigners();
    let signer = signers[0]._signer;

    // const provider = hardhat.hethers.providers.getDefaultProvider('testnet');
    // console.log(await provider.getCode(factory));

    // test with erc20, but comment the associate call
    // test implementing the "iterative" token approach
    // drop a line in the limechain -> hedera chat
    let reconnectedFactory = hethers.ContractFactory.getContract(factory, _uniswapV2FactoryAbi, signer);
    reconnectedFactory.on('PairCreated', (data) => {
        console.log(`Pair created data`, data);
    });
    // commented as pair is already created for whbar and one of the tokens
    const pairTx = await reconnectedFactory.createPair(
        token1EVMAddress,
        token2EVMAddress,
        gasLimitOverride);
    console.log(await pairTx.wait());

    await new Promise(resolve => setTimeout(resolve, 20000));
    const pairAddress = await reconnectedFactory.getPair(token1EVMAddress, token2EVMAddress, gasLimitOverride);
    console.log(pairAddress)
    return pairAddress
}

module.exports = createPair;

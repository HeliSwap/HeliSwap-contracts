// @ts-nocheck
import fs from "fs";
import hardhat from 'hardhat';

async function createPair(factory, token1EVMAddress, token2EVMAddress) {
    const gasLimitOverride = {gasLimit: 3000000};

    const _uniswapV2FactoryAbi = JSON.parse(fs.readFileSync('assets/UniswapV2Factory.abi.json').toString());

    let signers = await hardhat.hethers.getSigners();
    let signer = signers[0]._signer;

    let reconnectedFactory = hethers.ContractFactory.getContract(factory, _uniswapV2FactoryAbi, signer);
    const pairTx = await reconnectedFactory.createPair(
        token1EVMAddress,
        token2EVMAddress,
        gasLimitOverride);
    console.log(pairTx)

    const pairAddress = await reconnectedFactory.getPair(token1EVMAddress, token2EVMAddress, gasLimitOverride);
    console.log(pairAddress)
    return pairAddress
}

module.exports = createPair;

// @ts-nocheck
import fs from "fs";
import hardhat from 'hardhat';
import {hethers} from "@hashgraph/hethers";
import {getCreate2Address, keccak256, solidityPack} from "ethers/lib/utils";
import * as util from "util";

async function createPair(factory, token1EVMAddress, token2EVMAddress) {
    const gasLimitOverride = {gasLimit: 3000000};

    const _uniswapV2FactoryAbi = JSON.parse(fs.readFileSync('assets/UniswapV2Factory.abi.json').toString());

    let signers = await hardhat.hethers.getSigners();
    let signer = signers[0]._signer;
    let reconnectedFactory = hethers.ContractFactory.getContract(factory, _uniswapV2FactoryAbi, signer);
    const contract = await hardhat.hethers.getContractFactory('UniswapV2Pair');
    const bytecode = contract.bytecode;
    const init_code_hash = keccak256( bytecode.startsWith('0x') ? bytecode : `0x${bytecode}` );
    reconnectedFactory.on('PairCreated', (event) => {
        console.log(`PairCreated: `, event);
    });
    const pairAddressComputed = getCreate2Address(
        factory,
        keccak256(solidityPack(['address', 'address'], [token1EVMAddress, token2EVMAddress])),
        init_code_hash);
    console.log('computed pair addr', pairAddressComputed);
    const pairTx = await reconnectedFactory.createPair(
        token1EVMAddress,
        token2EVMAddress,
        gasLimitOverride);
    if (hardhat.network.name !== 'local') {
        const receipt = await pairTx.wait();
        const pairAddr = receipt.events[0].args?.[2];
        console.log(receipt.events);
        console.log('Pair address from receipt', pairAddr);
        return pairAddr;
    }
    await new Promise(resolve => setTimeout(resolve, 20000));
    return pairAddressComputed;
}

module.exports = createPair;
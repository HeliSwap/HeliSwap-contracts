// @ts-nocheck
import hardhat from 'hardhat';
import {getCreate2Address, keccak256, solidityPack} from "ethers/lib/utils";

async function createPair(factory, token1EVMAddress, token2EVMAddress) {
    let reconnectedFactory = await hardhat.hethers.getContractAt("UniswapV2Factory", factory);
    const contract = await hardhat.hethers.getContractFactory('UniswapV2Pair');
    const bytecode = contract.bytecode;
    const init_code_hash = keccak256( bytecode.startsWith('0x') ? bytecode : `0x${bytecode}` );
    const pairAddressComputed = getCreate2Address(
        factory,
        keccak256(solidityPack(['address', 'address'], [token1EVMAddress, token2EVMAddress])),
        init_code_hash);
    console.log('computed pair addr', pairAddressComputed);
    const pairTx = await reconnectedFactory.createPair(
        token1EVMAddress,
        token2EVMAddress);
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

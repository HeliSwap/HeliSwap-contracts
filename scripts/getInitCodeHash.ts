// @ts-nocheck
import {
    Client,
    AccountCreateTransaction,
    PublicKey,
    Hbar
} from "@hashgraph/sdk";
import hardhat from "hardhat";
import {keccak256} from "ethers/lib/utils";

async function getInitCodeHash() {
    const contract = await hardhat.hethers.getContractFactory('UniswapV2Pair');
    const bytecode = contract.bytecode;
    const init_code_hash = keccak256( bytecode.startsWith('0x') ? bytecode : `0x${bytecode}` );
    console.log(init_code_hash);
}

module.exports = getInitCodeHash;

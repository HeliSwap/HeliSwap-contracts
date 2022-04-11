// @ts-nocheck
import hardhat from 'hardhat';
import {hethers} from "@hashgraph/hethers";

async function depositWhbar(whbarAddr) {
    const [signer] = await hardhat.hethers.getSigners();
    const abi = await hardhat.hethers.getContractFactory('WHBAR');
    const contract = await hethers.ContractFactory.getContract(whbarAddr, abi.interface, signer);

    const depositTx = await contract.deposit({value: 100});
    console.log(await depositTx.wait());

    const supplyBefore = await contract.totalSupply();
    console.log(`WHBAR total supply ${hardhat.hethers.BigNumber.from(supplyBefore).toNumber()}`);
    /*await signer.sendTransaction({
        to: contract.address,
        value: 100000,
        gasLimit: 3000000,
        customData:{
            memo: "Deposit WHBAR from " + signer.address,
        }
    })*/
}

module.exports = depositWhbar;

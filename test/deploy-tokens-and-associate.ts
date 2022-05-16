// @ts-nocheck
import hardhat from 'hardhat';
import createHTS from '../scripts/utilities/create-hts';
import associateHTS from '../scripts/utilities/associate-hts';
import deployERC20 from '../scripts/utilities/deploy-erc20';
import mintERC20 from '../scripts/utilities/mint-erc20';
import {hethers} from "@hashgraph/hethers";

async function init(hederanetwork: string, factory: string, router:string) {
    let tokenA = await createHTS(hederanetwork, "TokenA", "tA");
    let tokenB = await createHTS(hederanetwork, "TokenB", "tB");

    console.log(tokenA)
    console.log(tokenB)

    let tokenC = await deployERC20("TokenC", "tC");
    let tokenD = await deployERC20("TokenD", "tD");

    console.log("Token deployment done.")

    // @ts-ignore
    let signers = await hardhat.hethers.getSigners();
    for (const signer of signers) {
        let clientAccount = signer._signer.account;
        let clientPK = signer._signingKey().privateKey;

        await mintERC20(tokenC, hethers.utils.getAddressFromAccount(clientAccount), "6000000000000000000000")
        await mintERC20(tokenD, hethers.utils.getAddressFromAccount(clientAccount), "6000000000000000000000")

        if (signer === signers[0]) {
            continue;
        }

        await associateHTS(hederanetwork, clientAccount, clientPK, tokenA.tokenId)
        await associateHTS(hederanetwork, clientAccount, clientPK, tokenB.tokenId)
    }

    console.log("Token association and minting to signers done.")
}

module.exports = init;

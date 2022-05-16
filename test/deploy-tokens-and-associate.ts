// @ts-nocheck
import hardhat from 'hardhat';
import createHTS from '../scripts/utilities/create-hts';
import associateHTS from '../scripts/utilities/associate-hts';
import deployERC20 from '../scripts/utilities/deploy-erc20';
import mintERC20 from '../scripts/utilities/mint-erc20';
import approveHTS from '../scripts/utilities/approve-hts';
import approveERC20 from '../scripts/utilities/erc20-approve';
import createPair from '../scripts/interactions/create-pair';
import {hethers} from "@hashgraph/hethers";

async function init(hederanetwork: string, factory: string, router:string) {
    let tokenA = await createHTS(hederanetwork, "TokenA", "tA");
    let tokenB = await createHTS(hederanetwork, "TokenB", "tB");

    console.log("HTS TokenA:", tokenA.tokenAddress)
    console.log("HTS TokenB:", tokenB.tokenAddress)

    let tokenC = await deployERC20("TokenC", "tC");
    let tokenD = await deployERC20("TokenD", "tD");

    console.log("HTS TokenC:", tokenC)
    console.log("HTS TokenD:", tokenD)

    console.log("Token deployment done.")
    console.log("==================================================================================================")

    // @ts-ignore
    let signers = await hardhat.hethers.getSigners();
    for (const signer of signers) {
        let clientAccount = signer._signer.account;
        let clientPK = signer._signingKey().privateKey;

        await mintERC20(tokenC, hethers.utils.getAddressFromAccount(clientAccount), "6000000000000000000000")
        await mintERC20(tokenD, hethers.utils.getAddressFromAccount(clientAccount), "6000000000000000000000")

        if (signer != signers[0]) {
            await associateHTS(hederanetwork, clientAccount, clientPK, tokenA.tokenId)
            await associateHTS(hederanetwork, clientAccount, clientPK, tokenB.tokenId)
        }
    
        let routerId = hethers.utils.getAccountFromAddress(router)
        let routerIdString = `${routerId.shard.toString()}.${routerId.realm.toString()}.${routerId.num.toString()}`
        await approveHTS(hederanetwork, clientAccount, clientPK, routerIdString, tokenA.tokenId, 200000000000);
        await approveHTS(hederanetwork, clientAccount, clientPK, routerIdString, tokenB.tokenId, 200000000000);
        await approveERC20(hederanetwork, tokenC, router, "10000000000000000000", clientAccount, clientPK);
        await approveERC20(hederanetwork, tokenD, router, "10000000000000000000", clientAccount, clientPK);

    }

    console.log("Token spending approval, association and minting to signers done.")
    console.log("==================================================================================================")

    await createPair(factory, tokenA.tokenAddress, tokenB.tokenAddress)

    console.log("[HTS-HTS] Pair creation done.")
    console.log("==================================================================================================")

    await createPair(factory, tokenC, tokenD)
    console.log("[ERC20-ERC20] Pair creation done.")
    console.log("==================================================================================================")

    await createPair(factory, tokenA.tokenAddress, tokenC)
    console.log("[HTS-ERC20] Pair creation done.")
    console.log("==================================================================================================")
}

module.exports = init;

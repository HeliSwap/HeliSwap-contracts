// @ts-nocheck
import hardhat from 'hardhat';
import createHTS from './create-hts';
import associateHTS from './associate-hts';
import deployERC20 from './deploy-erc20';
import mintERC20 from './mint-erc20';
import approveHTS from './approve-hts';
import approveERC20 from './erc20-approve';
import createPair from '../interactions/create-pair';
import {hethers} from "@hashgraph/hethers";

async function init(factory: string, router:string) {
    let tokenA = await createHTS("TokenA", "tA");
    let tokenB = await createHTS("TokenB", "tB");

    console.log("HTS TokenA:", tokenA.tokenAddress)
    console.log("HTS TokenB:", tokenB.tokenAddress)

    let tokenC = await deployERC20("TokenC", "tC");
    let tokenD = await deployERC20("TokenD", "tD");

    console.log("ERC20 TokenC:", tokenC)
    console.log("ERC20 TokenD:", tokenD)

    console.log("Token deployment done.")
    console.log("==================================================================================================")

    const htsPair = await createPair(factory, tokenA.tokenAddress, tokenB.tokenAddress)
    console.log(`[HTS-HTS] Pair creation done. - ${htsPair}`)
    console.log("==================================================================================================")

    const erc20Pair = await createPair(factory, tokenC, tokenD)
    console.log(`[ERC20-ERC20] Pair creation done. - ${erc20Pair}`)
    console.log("==================================================================================================")

    const mixedPair = await createPair(factory, tokenA.tokenAddress, tokenC)
    console.log(`[HTS-ERC20] Pair creation done. - ${mixedPair}`)
    console.log("==================================================================================================")

    // @ts-ignore
    let signers = await hardhat.hethers.getSigners();
    const erc20Amount = "6000000000000000000000";
    const htsAmount = "200000000000";

    const erc20ApproveAmount = "7000000000000000000000";
    const htsApproveAmount = 1000000000000;
    for (const signer of signers) {
        let clientAccount = signer._signer.account;
        let clientPK = signer._signingKey().privateKey;

        await mintERC20(tokenC, hethers.utils.getAddressFromAccount(clientAccount), erc20Amount)
        await mintERC20(tokenD, hethers.utils.getAddressFromAccount(clientAccount), erc20Amount)

        if (signer != signers[0]) {
            await associateHTS(clientAccount, clientPK, tokenA.tokenId)
            await associateHTS(clientAccount, clientPK, tokenB.tokenId)
        }

        let routerId = hethers.utils.getAccountFromAddress(router)
        let routerIdString = `${routerId.shard.toString()}.${routerId.realm.toString()}.${routerId.num.toString()}`

        await approveHTS(clientAccount, clientPK, routerIdString, tokenA.tokenId, htsApproveAmount);
        await approveHTS(clientAccount, clientPK, routerIdString, tokenB.tokenId, htsApproveAmount);

        await approveERC20(tokenC, router, erc20ApproveAmount, clientAccount, clientPK);
        await approveERC20(tokenD, router, erc20ApproveAmount, clientAccount, clientPK);
        await approveERC20(htsPair, router, erc20ApproveAmount, clientAccount, clientPK);
        await approveERC20(erc20Pair, router, erc20ApproveAmount, clientAccount, clientPK);
        await approveERC20(mixedPair, router, erc20ApproveAmount, clientAccount, clientPK);
    }

    console.log("Token spending approval, association and minting to signers done.")
    console.log("==================================================================================================")

    let tokenCId = hethers.utils.getAccountFromAddress(tokenC)
    let tokenCIdString = `${tokenCId.shard.toString()}.${tokenCId.realm.toString()}.${tokenCId.num.toString()}`
    let tokenDId = hethers.utils.getAccountFromAddress(tokenD)
    let tokenDIdString = `${tokenDId.shard.toString()}.${tokenDId.realm.toString()}.${tokenDId.num.toString()}`

    console.log("SUMMARY.")
    console.log(`HTS TokenA deployed at ${tokenA.tokenAddress} with id ${tokenA.tokenId}`)
    console.log(`HTS TokenB deployed at ${tokenB.tokenAddress} with id ${tokenB.tokenId}`)
    console.log(`ERC20 TokenC deployed at ${tokenC} with id ${tokenCIdString}`)
    console.log(`ERC20 TokenD deployed at ${tokenD} with id ${tokenDIdString}`)
    console.log("==================================================================================================")
    console.log(`[HTS-HTS] [${tokenA.tokenAddress}/${tokenB.tokenAddress}] Pair deployed at ${htsPair}`)
    console.log(`[ERC20-ERC20] [${tokenC}/${tokenD}] Pair deployed at ${erc20Pair}`)
    console.log(`[HTS-ERC20] [${tokenA.tokenAddress}/${tokenC}] Pair deployed at ${mixedPair}`)
    console.log("==================================================================================================")
    console.log(`Every signer has ${erc20Amount} of each ERC20 token and has approved ${router} to spend ${erc20ApproveAmount} of each of their ERC20 tokens.`)
    console.log(`Every signer has ${htsAmount} of each HTS token and has approved ${router} to spend ${htsApproveAmount} of each of their HTS tokens.`)
    console.log("==================================================================================================")
    console.log("All approvals and associations have been done successfully.")
}

module.exports = init;

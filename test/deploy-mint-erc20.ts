// @ts-nocheck
import hardhat from 'hardhat';
import deployERC20 from '../scripts/utilities/deploy-erc20';
import mintERC20 from '../scripts/utilities/mint-erc20';
import approveERC20 from '../scripts/utilities/erc20-approve';
import {hethers} from "@hashgraph/hethers";

async function deployMintERC20(hederanetwork: string, factory: string, router:string) {
    let TOKEN = await deployERC20("Token", "t");

    console.log("ERC20 Token:", TOKEN)

    console.log("Token deployment done.")
    console.log("==================================================================================================")

    // @ts-ignore
    let signers = await hardhat.hethers.getSigners();
    const erc20Amount = "6000000000000000000000";

    const erc20ApproveAmount = "7000000000000000000000";
    for (const signer of signers) {
        let clientAccount = signer._signer.account;
        let clientPK = signer._signingKey().privateKey;

        await mintERC20(TOKEN, hethers.utils.getAddressFromAccount(clientAccount), erc20Amount)
        await approveERC20(hederanetwork, TOKEN, router, erc20ApproveAmount, clientAccount, clientPK);
    }

    console.log("Token spending approval, association and minting to signers done.")
    console.log("==================================================================================================")

    let tokenId = hethers.utils.getAccountFromAddress(TOKEN)
    let tokenIdString = `${tokenId.shard.toString()}.${tokenId.realm.toString()}.${tokenId.num.toString()}`

    console.log("SUMMARY.")
    console.log(`ERC20 Token deployed at ${TOKEN} with id ${tokenIdString}`)
    console.log("==================================================================================================")
    console.log(`Every signer has ${erc20Amount} of each ERC20 token and has approved ${router} to spend ${erc20ApproveAmount} of each of their ERC20 tokens.`)
    console.log("==================================================================================================")
}

module.exports = deployMintERC20;

// @ts-nocheck
import hardhat from 'hardhat';

async function approve(tokenAddr, spenderAddr, amount) {
    console.log(`Approving ${spenderAddr} to spent ${amount} of ${tokenAddr} token.`);

    const token = await hardhat.hethers.getContractAt('contracts/core/interfaces/IERC20.sol:IERC20', tokenAddr)
    const approval = await token.approve(spenderAddr, amount);
    const txReceipt = await approval.wait();

    console.log(`Approved: ${txReceipt.transactionHash}`)
}

module.exports = approve;

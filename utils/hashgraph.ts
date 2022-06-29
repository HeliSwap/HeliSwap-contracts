import NodeClient from "@hashgraph/sdk/lib/client/NodeClient";
import {
	Client,
	Key,
	PrivateKey,
	TokenAssociateTransaction,
	AccountAllowanceApproveTransaction,
	TokenCreateTransaction,
	TransactionId, TransferTransaction
} from "@hashgraph/sdk";
import {hethers} from "@hashgraph/hethers";
import Long from "long";

/**
 * Utility namespace for interacting with Hedera Network
 */
export namespace Hashgraph {

	const DEFAULT_ACCOUNT = "0.0.0";
	const DEFAULT_KEY = new Key();

	/**
	 * Deploys HTS Token with the specified parameters
	 * @param client Network client to use
	 * @param pk ECDSA PK fo the client
	 * @param name Name of the HTS Token
	 * @param symbol Symbol of the HTS token
	 * @param supply The initial supply of the HTS token, transferred to the client operator
	 * @param decimals (optional) The decimals of the HTS token
	 */
	export async function deployToken(
		client: NodeClient,
		pk: string,
		name: string,
		symbol: string,
		supply: hethers.BigNumber,
		decimals = 8
	): Promise<object> {
		const tokenCreate = await (await new TokenCreateTransaction()
			.setTokenName(name)
			.setTokenSymbol(symbol)
			.setExpirationTime(_getExpiration())
			.setDecimals(decimals)
			.setInitialSupply(Long.fromString(supply.toString()))
			.setTreasuryAccountId(client.operatorAccountId || DEFAULT_ACCOUNT)
			.setTransactionId(TransactionId.generate(client.operatorAccountId || DEFAULT_ACCOUNT))
			.setNodeAccountIds([client._network.getNodeAccountIdsForExecute()[0]])
			.freeze()
			.sign(PrivateKey.fromStringECDSA(pk)))
			.execute(client)

		const receipt = await tokenCreate.getReceipt(client);
		const tokenId = receipt.tokenId?.toString() || "0.0.0";
		console.log(tokenId)
		return {tokenAddress: hethers.utils.getAddressFromAccount(tokenId), tokenId: tokenId};
	}

	/**
	 * Associates an HTS Token to a specified account
	 * @param client Network client to use
	 * @param pk ECDSA PK for the client
	 * @param account the account we are associating
	 * @param tokenid the id of the token which is getting associated
	 */
	export async function associateToken(
		client: NodeClient,
		pk: string,
		account: string,
		tokenid: string
	): Promise<void> {
		const tokenAssociate = await (await new TokenAssociateTransaction()
			.setAccountId(account)
			.setTokenIds([tokenid])
			.freezeWith(client)
			.sign(PrivateKey.fromStringECDSA(pk)))
			.execute(client);
		const associateReceipt = await tokenAssociate.getReceipt(client);
		console.log(associateReceipt)
	}

	/**
	 * Approves an account's HTS Token to be spent by another account
	 * @param client Network client to use
	 * @param pk ECDSA PK for the client
	 * @param ownerAccount the lender account
	 * @param spenderAccount the spender account
	 * @param tokenid the id of the token which is getting associated
	 * @param amount the amount of the tokens which is being permitted to be spent
	 */
	export async function approveToken(
		client: NodeClient,
		pk: string,
		ownerAccount: string,
		spenderAccount: string,
		tokenid: string,
		amount: number
	): Promise<void> {
		const tokenApprove = await (await new AccountAllowanceApproveTransaction()
			.addTokenAllowance(tokenid, spenderAccount, amount)
			.freezeWith(client)
			.sign(PrivateKey.fromStringECDSA(pk)))
			.execute(client);
		const approveReceipt = await tokenApprove.getReceipt(client);
		console.log(approveReceipt)
	}

	/**
	 * Transfers tokens from the client operator (signer 1) to a specified account
	 * @param client Network client to use
	 * @param pk ECDSA PK for the client
	 * @param account the account that will receive tokens
	 * @param tokenid the id of the token which is getting transfered
	 * @param amount the amount of tokens which is getting transfered
	 */
	export async function transferToken(
		client: NodeClient,
		pk: string,
		account: string,
		tokenid: string,
		amount: number
	): Promise<void> {
		const tokenTransfer = await (await new TransferTransaction()
            .addTokenTransfer(tokenid, client.operatorAccountId || DEFAULT_ACCOUNT, -amount)
            .addTokenTransfer(tokenid, account, amount)
            .freezeWith(client)
            .sign(PrivateKey.fromStringECDSA(pk)))
            .execute(client);
        const tokenTransferReceipt = await tokenTransfer.getReceipt(client);
	}

	/**
	 * Returns Client for the specified network name
	 * @param network
	 */
	export function clientFor(network: string): NodeClient {
		if (network == "previewnet") return Client.forPreviewnet();
		if (network == "testnet") return Client.forTestnet();
		if (network == "mainnet") return Client.forMainnet();
		if (network == "local") return Client.forNetwork({"127.0.0.1:50211": "0.0.3"})

		throw Error("INVALID_NETWORK")
	}

	function _getExpiration(): Date {
		const exp = new Date();
		exp.setDate(exp.getDate() + 30);
		return exp;
	}


}

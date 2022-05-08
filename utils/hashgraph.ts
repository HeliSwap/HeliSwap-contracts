import NodeClient from "@hashgraph/sdk/lib/client/NodeClient";
import {Client, Key, PrivateKey, PublicKey, TokenCreateTransaction, TransactionId} from "@hashgraph/sdk";
import {hethers} from "@hashgraph/hethers";

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
		supply: number,
		decimals = 8
	): Promise<string> {
		const tokenCreate = await (await new TokenCreateTransaction()
			.setTokenName(name)
			.setTokenSymbol(symbol)
			.setExpirationTime(_getExpiration())
			.setDecimals(decimals)
			.setInitialSupply(supply)
			.setTreasuryAccountId(client.operatorAccountId || DEFAULT_ACCOUNT)
			.setAdminKey(client.operatorPublicKey || DEFAULT_KEY)
			.setFreezeKey(client.operatorPublicKey || DEFAULT_KEY)
			.setWipeKey(client.operatorPublicKey || DEFAULT_KEY)
			.setKycKey(client.operatorPublicKey || DEFAULT_KEY)
			.setSupplyKey(client.operatorPublicKey || DEFAULT_KEY)
			.setTransactionId(TransactionId.generate(client.operatorAccountId || DEFAULT_ACCOUNT))
			.setNodeAccountIds([client._network.getNodeAccountIdsForExecute()[0]])
			.setFreezeDefault(false)
			.freeze()
			.sign(PrivateKey.fromStringECDSA(pk)))
			.execute(client)

		const receipt = await tokenCreate.getReceipt(client);
		const tokenId = receipt.tokenId?.toString() || "0.0.0";
		return hethers.utils.getAddressFromAccount(tokenId);
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
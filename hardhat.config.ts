import '@nomiclabs/hardhat-waffle';
import 'hardhat-abi-exporter';
import 'solidity-coverage';
import 'hardhat-gas-reporter';
import 'hardhat-hethers';
import * as config from './config';
import {task} from "hardhat/config";

task('init', 'Deploys an HTS token')
	.addParam("hederanetwork", "The network to create account in")
	.addParam("factory", "Heliswap factory address")
	.addParam("router", "Heliswap router address")
	.setAction(async (taskArgs) => {
		console.log(taskArgs)
		const tokenDeployment = require('./test/deploy-tokens-and-associate');
		await tokenDeployment(taskArgs.hederanetwork, taskArgs.factory, taskArgs.router);
	});

task('createAccount', 'Generates ECDSA Account')
	.addParam("hederanetwork", "The network to create account in")
	.addParam("account", "The creator account to be used")
	.addParam("pk", "The ED2559 PK to be used for the creation")
	.addParam("balance", "The initial Hbar balance of the account")
	.setAction(async (taskArgs) => {
		console.log(taskArgs);
		const createAccounts = require('./scripts/utilities/create-account');
		await createAccounts(taskArgs.hederanetwork, taskArgs.account, taskArgs.pk, taskArgs.balance);
	});

task('createHTS', 'Deploys an HTS token')
	.addParam("hederanetwork", "The network to create account in")
	.addParam("name", "The name of the HTS token")
	.addParam("symbol", "The symbol of the HTS token")
	.setAction(async (taskArgs) => {
		console.log(taskArgs)
		const tokenDeployment = require('./scripts/utilities/create-hts');
		await tokenDeployment(taskArgs.hederanetwork, taskArgs.name, taskArgs.symbol);
	});

task('associateHTS', 'Associates an HTS token')
	.addParam("hederanetwork", "The network to create account in")
	.addParam("accountid", "The account that will be associated")
	.addParam("pk", "The PK of the account that will be associated")
	.addParam("tokenid", "The token that will is getting associated to")
	.setAction(async (taskArgs) => {
		console.log(taskArgs)
		const tokenAssociation = require('./scripts/utilities/associate-hts');
		await tokenAssociation(taskArgs.hederanetwork, taskArgs.accountid, taskArgs.pk, taskArgs.tokenid);
	});

task('approveHTS', 'Approves an HTS token for spending by an account')
	.addParam("hederanetwork", "The network to perform the approval tx in")
	.addParam("accountid", "The account that will give permission")
	.addParam("pk", "The PK of the account that will permit")
	.addParam("spenderaccountid", "The account that will be permitted to spend tokens")
	.addParam("tokenid", "The token will be spent")
	.addParam("amount", "How many tokens will be spent")
	.setAction(async (taskArgs) => {
		console.log(taskArgs)
		const tokenApproval = require('./scripts/utilities/approve-hts');
		await tokenApproval(taskArgs.hederanetwork, taskArgs.accountid, taskArgs.pk, taskArgs.spenderaccountid, taskArgs.tokenid, taskArgs.amount);
	});

task('transferHTS', 'Transfers an HTS token')
	.addParam("hederanetwork", "The network to create account in")
	.addParam("accountid", "The account that tokens will be transferred to")
	.addParam("tokenid", "The token that will be getting transferred")
	.addParam("amount", "The amount of tokens that will be getting transferred")
	.setAction(async (taskArgs) => {
		console.log(taskArgs)
		const tokenTransfer = require('./scripts/utilities/transfer-hts');
		await tokenTransfer(taskArgs.hederanetwork, taskArgs.accountid, taskArgs.tokenid, taskArgs.amount);
	});

task('deployWhbar', 'Deploys WHBAR instance')
	.setAction(async () => {
		const whbarDeployment = require('./scripts/deploy-whbar');
		await whbarDeployment();
	});


task('deployERC20', 'Deploys ERC20 token')
	.addParam("name", "The name of the ERC20 token")
	.addParam("symbol", "The symbol of the ERC20 token")
	.setAction(async (taskArgs) => {
		console.log(taskArgs);
		const erc20Deployment = require('./scripts/utilities/deploy-erc20');
		await erc20Deployment(taskArgs.name, taskArgs.symbol);
	})

task('mintERC20', 'Mints ERC20 token')
	.addParam("token", "The address of the ERC20 token")
	.addParam("receiver", "The address of the receiver")
	.setAction(async (taskArgs) => {
		console.log(taskArgs);
		const erc20mint = require('./scripts/utilities/mint-erc20');
		await erc20mint(taskArgs.token, taskArgs.receiver, taskArgs.amount);
	})

task('deploy', 'Deploys the HeliSwap contracts')
	.addParam('whbar', "The WHBAR address to use")
	.setAction(async (taskArgs) => {
		const deployment = require('./scripts/deploy');
		await deployment(taskArgs.whbar);
	});

task('getInitCodeHash').setAction(async () => {
	const getInitCodeHash = require('./scripts/utilities/get-init-code-hash');
	await getInitCodeHash();
});

task('addLiquidity', 'Adds liquidity to a pair')
	.addParam("router", "The router address")
	.addParam("token0", "The first token")
	.addParam("token1", "The second token")
	.addParam("amount0", "First token amount")
	.addParam("amount1", "Second token amount")
	.setAction(async (taskArgs) => {
		const addLiquidity = require('./scripts/interactions/add-liquidity');
		await addLiquidity(taskArgs.router, taskArgs.token0, taskArgs.amount0, taskArgs.token1, taskArgs.amount1);
	});

task('removeLiquidity', 'Removes liquidity from a pair')
	.addParam("router")
	.addParam("token1")
	.addParam("token2")
	.setAction(async (taskArgs) => {
		const removeLiquidity = require('./scripts/interactions/remove-liquidity');
		// @ts-ignore
		await removeLiquidity(taskArgs.router, taskArgs.token1, taskArgs.token2);
	});

task('addLiquidityETH', 'Adds HBAR liquidity')
	.addParam('router')
	.addParam('token1')
	.setAction(async (taskArgs) => {
		const addLiquidityETH = require('./scripts/interactions/add-liquidity-hbar');
		await addLiquidityETH(taskArgs.router, taskArgs.token1);
	});

task('swap', 'Performs a basic swap of two tokens')
	.addParam("router")
	.addParam("token1")
	.addParam("token2")
	.setAction(async (taskArgs) => {
		const swap = require('./scripts/interactions/swap');
		// @ts-ignore
		await swap(taskArgs.router, taskArgs.token1, taskArgs.token2);
	});

task('createPair', 'Creates a pair of two tokens')
	.addParam("factory")
	.addParam("token1")
	.addParam("token2")
	.setAction(async (taskArgs) => {
		const createPair = require('./scripts/interactions/create-pair');
		// @ts-ignore
		await createPair(taskArgs.factory, taskArgs.token1, taskArgs.token2);
	});

task('getContractInfo').addParam('addr').addParam('hederanetwork').setAction(async (taskArgs) => {
	const getPair = require('./scripts/utilities/get-contract-info');
	// @ts-ignore
	await getPair(taskArgs.hederanetwork, taskArgs.addr);
});

task('getTxRecord').addParam('txid').setAction(async (taskArgs) => {
	const getTxRecord = require('./scripts/utilities/get-tx-record');
	// @ts-ignore
	await getTxRecord(taskArgs.txid);
});

task('getAccountBalanceInfo').addParam('hederanetwork').addParam('accountid').setAction(async (taskArgs) => {
	const getPair = require('./scripts/utilities/get-account-balance');
	// @ts-ignore
	await getPair(taskArgs.hederanetwork, taskArgs.accountid);
});

task('approve')
	.addParam('token')
	.addParam('spender')
	.addParam('amount')
	.addParam('lender')
	.addParam('lenderpk')
	.setAction(async (taskArgs) => {
		const approve = require('./scripts/utilities/erc20-approve');
		await approve(taskArgs.token, taskArgs.spender, taskArgs.amount, taskArgs.lender, taskArgs.lenderpk);
	});


module.exports = {
	solidity: {
		compilers: [
			{
				version: "0.8.4",
			},
			{
				version: "0.8.7"
			},
			{
				version: "0.8.12"
			},
			{
				version: "0.6.6",
				settings: {
					optimizer: {
						enabled: true,
						runs: 200
					}
				}
			},
			{
				version: "0.5.16"
			},
			{
				version: "0.4.18"
			}
		],
		settings: {
			optimizer: {
				enabled: true,
				runs: 200,
			},
		},
	},
	hedera: {
		networks: config.networks,
		gasLimit: 3000000
	},
	defaultNetwork: 'previewnet',
	abiExporter: {
		only: [],
		except: ['.*Mock$'],
		clear: true,
		flat: true,
	},
	gasReporter: {
		enabled: true,
	}
};

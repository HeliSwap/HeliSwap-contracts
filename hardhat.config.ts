import '@nomiclabs/hardhat-waffle';
import '@nomiclabs/hardhat-etherscan';
import 'hardhat-abi-exporter';
import 'solidity-coverage';
import 'hardhat-gas-reporter';
import 'hardhat-hethers';
import * as config from './config';
import {task} from "hardhat/config";

task('createAccount', 'Generates ECDSA Account')
	.addParam("hederaNetwork", "The network to create account in")
	.addParam("account", "The creator account to be used")
	.addParam("pk", "The ED2559 PK to be used for the creation")
	.addParam("balance", "The initial Hbar balance of the account")
	.setAction(async (taskArgs) => {
		console.log(taskArgs);
		const createAccounts = require('./scripts/utilities/create-account');
		await createAccounts(taskArgs.hederaNetwork, taskArgs.account, taskArgs.pk, taskArgs.balance);
	});

task('createHTS', 'Deploys an HTS token')
	.addParam("hederaNetwork", "The network to create account in")
	.addParam("name", "The name of the HTS token")
	.addParam("symbol", "The symbol of the HTS token")
	.setAction(async (taskArgs) => {
		console.log(taskArgs)
		const tokenDeployment = require('./scripts/utilities/create-hts');
		await tokenDeployment(taskArgs.hederaNetwork, taskArgs.name, taskArgs.symbol);
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

task('deploy', 'Deploys the HeliSwap contracts')
	.addParam('whbar', "The WHBAR address to use")
	.setAction(async (taskArgs) => {
		const deployment = require('./scripts/deploy');
		await deployment(taskArgs.whbar);
	});

task('addLiquidity', 'Adds liquidity to a pair')
	.addParam("router")
	.addParam("token1")
	.addParam("token2")
	.setAction(async (taskArgs) => {
		const addLiquidity = require('./scripts/interactions/add-liquidity');
		// @ts-ignore
		await addLiquidity(taskArgs.router, taskArgs.token1, taskArgs.token2);
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
	etherscan: config.etherscan,
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

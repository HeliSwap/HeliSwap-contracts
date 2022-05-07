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
		const createAccounts = require('./scripts/create-account');
		await createAccounts(taskArgs.hederaNetwork, taskArgs.account, taskArgs.pk, taskArgs.balance);
	});

task('deployTokens', 'Deploys 3 tokens')
	.setAction(async () => {
		const tokenDeployment = require('./scripts/deployTokens');
		await tokenDeployment();
	});

task('deployWhbar', 'Deploys WHBAR instance')
	.setAction(async () => {
		const whbarDeployment = require('./scripts/deploy-whbar');
		await whbarDeployment();
	});

task('deploy', 'Deploys the HeliSwap contracts')
	.setAction(async () => {
		const deployment = require('./scripts/deploy');
		await deployment();
	});

task('addLiquidity', 'Adds liquidity to a pair')
	.addParam("router")
	.addParam("token1")
	.addParam("token2")
	.setAction(async (taskArgs) => {
		const addLiquidity = require('./scripts/addLiquidity');
		// @ts-ignore
		await addLiquidity(taskArgs.router, taskArgs.token1, taskArgs.token2);
	});

task('swap', 'Performs a basic swap of two tokens')
	.addParam("router")
	.addParam("token1")
	.addParam("token2")
	.setAction(async (taskArgs) => {
		const swap = require('./scripts/swap');
		// @ts-ignore
		await swap(taskArgs.router, taskArgs.token1, taskArgs.token2);
	});

task('createPair', 'Creates a pair of two tokens')
	.addParam("factory")
	.addParam("token1")
	.addParam("token2")
	.setAction(async (taskArgs) => {
		const createPair = require('./scripts/createPair');
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

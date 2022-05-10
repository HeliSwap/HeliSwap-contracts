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

task('getInitCodeHash').setAction(async  () => {
    const getInitCodeHash = require('./scripts/getInitCodeHash');
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
        await addLiquidity(taskArgs.router, taskArgs.token0, taskArgs.token1, taskArgs.amount0, taskArgs.amount1);
    });

task('removeLiquidity', 'Removes liquidity from a pair')
    .addParam("router")
    .addParam("token1")
    .addParam("token2")
    .setAction(async (taskArgs) => {
        const removeLiquidity = require('./scripts/removeLiquidity');
        // @ts-ignore
        await removeLiquidity(taskArgs.router, taskArgs.token1, taskArgs.token2);
    });

task('addLiquidityETH', 'Adds HBAR liquidity')
    .addParam('router')
    .addParam('token1')
    .setAction(async (taskArgs) => {
        const addLiquidityETH = require('./scripts/addLiquidityETH');
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

task('getContractInfo').addParam('addr').setAction(async (taskArgs) => {
    const getPair = require('./scripts/getPair');
    // @ts-ignore
    await getPair(taskArgs.addr);
});

task('approve')
    .addParam('token')
    .addParam('spender')
    .addParam('amount')
    .addParam('lender')
    .addParam('lenderpk')
    .setAction(async (taskArgs) => {
        const approve = require('./scripts/erc20ApproveAddress');
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

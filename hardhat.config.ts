import '@nomiclabs/hardhat-waffle';
import '@nomiclabs/hardhat-etherscan';
import 'hardhat-abi-exporter';
import 'solidity-coverage';
import 'hardhat-gas-reporter';
import 'hardhat-hethers';
import * as config from './config.sample';
import {task} from "hardhat/config";

task('createAccounts', 'Generates Accounts')
    .setAction(async () => {
        const createAccounts = require('./scripts/createAccounts');
        await createAccounts();
    });

task('deployTokens', 'Deploys 3 tokens')
    .setAction(async () => {
        const tokenDeployment = require('./scripts/deployTokens');
        await tokenDeployment();
    });

task('addLiquidityETH', 'Adds HBAR liquidity')
    .addParam('router')
    .addParam('token1')
    .setAction(async (taskArgs) => {
        const addLiquidityETH = require('./scripts/addLiquidityETH');
        await addLiquidityETH(taskArgs.router, taskArgs.token1);
    });

task('depositWHBAR', 'Deposit hbar via the receive function of the WHBAR contract')
    .addParam('whbar')
    .setAction(async (taskArgs) => {
        const depositWHBAR = require('./scripts/depositWhbar');
        await depositWHBAR(taskArgs.whbar);
    });

task('deploy', 'Deploys the Greeter contract')
    .addParam('whbar')
    .setAction(async (taskArgs) => {
        const deployment = require('./scripts/deploy');
        await deployment(taskArgs.whbar);
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
                version: "0.4.18"
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
        gasLimit: 300000
    },
    defaultNetwork: 'testnet',
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

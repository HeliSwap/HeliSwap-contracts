// @ts-nocheck
import { NetworksUserConfig } from 'hardhat/types';
import { EtherscanConfig } from '@nomiclabs/hardhat-etherscan/dist/src/types';

export const networks: NetworksUserConfig = module.exports = {
    solidity: "0.8.4",
    defaultNetwork: "testnet",
    hedera: {
        gasLimit: 300000,
        networks: {
            testnet: {
                accounts: [
                    {
                        "account": process.env.TESTNET_ACCOUNT_ID_1,
                        "privateKey": process.env.TESTNET_PRIVATEKEY_1
                    },
                    {
                        "account": process.env.TESTNET_ACCOUNT_ID_2,
                        "privateKey": process.env.TESTNET_PRIVATEKEY_2
                    }
                ]
            },
            previewnet: {
                accounts: [
                    {
                        "account": process.env.ACCOUNT_ID,
                        "privateKey": process.env.PRIVATE_KEY
                    }
                ]
            },
            // customHederaNetwork: {
            //     consensusNodes: [
            //         {
            //             url: 'http://127.0.0.1:50211',
            //             nodeId: '0.0.3'
            //         },
            //     ],
            //     mirrorNodeUrl: 'http://127.0.0.1:5600',
            //     chainId: 0,
            //
            //     accounts: [
            //         {
            //             "account": "0.0.1001",
            //             "privateKey": "0xe2ed0ae5952280b00072999afee451dfef4fc5b2710667018bc782c2d15f35e5"
            //         },
            //         {
            //             "account": "0.0.1002",
            //             "privateKey": "0xb7fa75074cad2995fe17b367b67ec11a4fc8c69c813b922282448622665e97d0"
            //         }
            //     ]
            // }
        }
    },
    networks: {},
};

export const etherscan: EtherscanConfig = {
	// apiKey: 'YOUR-ETHERSCAN-API-KEY',
};

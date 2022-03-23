// @ts-nocheck
import { NetworksUserConfig } from 'hardhat/types';
import { EtherscanConfig } from '@nomiclabs/hardhat-etherscan/dist/src/types';

export const networks: NetworksUserConfig = {
    // previewnet: {
    //     accounts: [
    //         {
    //             "account": "0.0.XXXXXX",
    //             "privateKey": "0xPrivateKey"
    //         }
    //     ]
    // },
    // testnet: {
    //     accounts: [
    //         {
    //             "account": "0.0.XXXXXX",
    //             "privateKey": "0xPrivateKey"
    //         }
    //     ]
    // },
    customHederaNetwork: {
        consensusNodes: [
            {
                url: '127.0.0.1:50211',
                nodeId: '0.0.3'
            },
        ],
        mirrorNodeUrl: '1',
        chainId: 0,

        accounts: [
            {
                "account": "0.0.XXXXXX",
                "privateKey": "0xPrivateKey"
            }
        ]
    }
};

export const etherscan: EtherscanConfig = {
    // apiKey: 'YOUR-ETHERSCAN-API-KEY',
};

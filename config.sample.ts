// @ts-nocheck
import {NetworksUserConfig} from 'hardhat/types';
import {EtherscanConfig} from '@nomiclabs/hardhat-etherscan/dist/src/types';

export const networks: NetworksUserConfig = {
    testnet: {
        consensusNodes: [
            {
                url: '0.testnet.hedera.com:50211',
                nodeId: '0.0.3'
            },
            {
                url: '1.testnet.hedera.com:50211',
                nodeId: '0.0.4'
            },
            {
                url: '2.testnet.hedera.com:50211',
                nodeId: '0.0.5'
            },
            {
                url: '3.testnet.hedera.com:50211',
                nodeId: '0.0.6'
            }
        ],
        mirrorNodeUrl: 'https://testnet.mirrornode.hedera.com',
        chainId: 293,
        accounts: [
            // @ts-ignore
            {
                account: '0.0.34172457',
                privateKey: '0x2cf3cc6054d7681eaf6a3e927a6a2b520be507c230b1a13981b66edc56f039b9',
            },
            // @ts-ignore
            {
                account: '0.0.34172458',
                privateKey: '0xaf812811567817ef98eada58188664bf5ead94cd6d9caa02dc468eee464a30fd'
            },
            // @ts-ignore
            {
                account: '0.0.34172459',
                privateKey: '0xc27693a7a9d1773023e1b63b30ec62d4205226f12e90f02916be56a6d33197e9'
            }
        ]
    },
};

export const etherscan: EtherscanConfig = {
    // apiKey: 'YOUR-ETHERSCAN-API-KEY',
};

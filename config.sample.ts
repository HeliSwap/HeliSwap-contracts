// @ts-nocheck
import {NetworksUserConfig} from 'hardhat/types';
import {EtherscanConfig} from '@nomiclabs/hardhat-etherscan/dist/src/types';

export const networks: NetworksUserConfig = {
    testnet: {
        consensusNodes: [
            {
                url: '0.testnet.hedera.com:50211',
                nodeId: '0.0.3'
            }
        ],
        mirrorNodeUrl: 'https://testnet.mirrornode.hedera.com',
        chainId: 293,
        accounts: [
            {
                account: '0.0.34256816',
                privateKey: '0x92f3dd8ecbe925ff75a557a74f6c047d2276d312ee82cac32ffdf56899efdec4',
            },
            {
                account: '0.0.34256817',
                privateKey: '0xf2763911749823128667a3e2ccb97c9e733940409579fa4c83af55097955a64e'
            },
            {
                account: '0.0.34256818',
                privateKey: '0x80b08fc94be9c444f406bc9797ed1b67dc3a3cd6fb46e211c4ec191c9d6dfdc4'
            }
        ]
    },
};

export const etherscan: EtherscanConfig = {
    // apiKey: 'YOUR-ETHERSCAN-API-KEY',
};

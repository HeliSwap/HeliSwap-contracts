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
                account: '0.0.34192872',
                privateKey: '0x8adcf1bada5536372ade696171d4e3f65b22514ac6ea5319cd25ce54792cd1bf',
            },
            {
                account: '0.0.34192874',
                privateKey: '0x4bec4a44e6a56b3cfd9cff507a997b48451af0ad90568b9dbd33f8dd667dacc0'
            },
            {
                account: '0.0.34192877',
                privateKey: '0x7461b7f879262cb85c7c05cee3cbf70831cf36ba2735aba3fcf2e95890b5e390'
            }
        ]
    },
};

export const etherscan: EtherscanConfig = {
    // apiKey: 'YOUR-ETHERSCAN-API-KEY',
};

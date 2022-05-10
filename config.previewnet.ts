// @ts-nocheck
import { NetworksUserConfig } from 'hardhat/types';
import { EtherscanConfig } from '@nomiclabs/hardhat-etherscan/dist/src/types';

export const networks: NetworksUserConfig = {
    previewnet: {
        consensusNodes: [
            {
                url: '35.231.208.148:50211',
                nodeId: '0.0.3'
            }
        ],
        mirrorNodeUrl: 'https://previewnet.mirrornode.hedera.com/',
        chainId: 293,
        accounts: [
            {
                account: '0.0.5236',
                privateKey: '0x0bcff451f02e2ef7074d466f6f4fb7440574e22d63fbf1e784a9cf353993d773',
            },
            {
                account: '0.0.5237',
                privateKey: '0x413f617121d661b0476c2ebd9a6e9e0ff25aec19c2a6f620ffc67f6b73b1ed89'
            },
            {
                account: '0.0.5238',
                privateKey: '0x92d7e32fe5ae33e69480dd55092b8b0db0c125a209a5eb4260248c3b0ffcb0c9'
            }
        ]
    },
    // testnet: {
    //     accounts: [
    //         {
    //             "account": "0.0.29631749",
    //             "privateKey": "0x18a2ac384f3fa3670f71fc37e2efbf4879a90051bb0d437dd8cbd77077b24d9b"
    //         },
    //         {
    //             "account": "0.0.29631750",
    //             "privateKey": "0x6357b34b94fe53ded45ebe4c22b9c1175634d3f7a8a568079c2cb93bba0e3aee"
    //         }
    //     ]
    // },
    local: {
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
                "account": "0.0.1001",
                "privateKey": "0xbd8b8c10b402ecdb82a341a729ab95bc2a91b780ed8e286522fb8c737c4879a4"
            },
            {
                "account": "0.0.1002",
                "privateKey": "0x5b6708fd6bc630c5dba30855e06fb61202a03f1eecb929c3c83de419e7b2b2bd"
            },
            {
                "account": "0.0.1003",
                "privateKey": "0x3abefffa1015cdfb51ee5424b946cdd4992b6c223ce7af4de205d00b0ff0eebe"
            }
        ]
    }
};

export const etherscan: EtherscanConfig = {
    // apiKey: 'YOUR-ETHERSCAN-API-KEY',
};
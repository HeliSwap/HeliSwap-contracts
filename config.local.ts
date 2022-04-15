// @ts-nocheck
import {NetworksUserConfig} from 'hardhat/types';
import {EtherscanConfig} from '@nomiclabs/hardhat-etherscan/dist/src/types';

export const networks: NetworksUserConfig = {
    local: {
        name: 'local',
        consensusNodes: [
            {
                url: '127.0.0.1:50211',
                nodeId: '0.0.3'
            }
        ],
        mirrorNodeUrl: '1',
        chainId: 0,
        accounts: [
            {
                account: '0.0.1189',
                privateKey:"0x74bb25a7d01803ff885982f519b59e0fc335df34224705caea33a85550462e26",
            },
            {
                account: '0.0.1190',
                privateKey: "0x923a13eecb935c26ea9fb0af208867f51b4844211e0066e754bf32d8ccac196d",
            },
            {
                account: '0.0.1191',
                privateKey: "0x30966d12df59920fca073552e57160155650c4523254993bec386eaf1d18b8a4",
            }
        ]
    },
};

export const etherscan: EtherscanConfig = {
    // apiKey: 'YOUR-ETHERSCAN-API-KEY',
};

// @ts-nocheck
import {NetworksUserConfig} from 'hardhat/types';

export const networks: NetworksUserConfig = {
	// Use the three accounts created and logged by createAccounts script
	local: {
		consensusNodes: [
			{
				url: '127.0.0.1:50211',
				nodeId: '0.0.3'
			}
		],
		mirrorNodeUrl: 'http://127.0.0.1:5551',
		chainId: 0,
		accounts: [
			{
				"account": '0.0.1002',
				"privateKey": '0x7f109a9e3b0d8ecfba9cc23a3614433ce0fa7ddcc80f2a8f10b222179a5a80d6'
			},
			{
				"account": '0.0.1003',
				"privateKey": '0x6ec1f2e7d126a74a1d2ff9e1c5d90b92378c725e506651ff8bb8616a5c724628'
			}
		]
	}
};

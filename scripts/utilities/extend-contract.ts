const {
  Client,
  AccountId,
  PrivateKey,
  ContractUpdateTransaction,
  Timestamp,
} = require('@hashgraph/sdk');
const axios = require('axios');
require('dotenv').config();

console.clear();

const operatorId = AccountId.fromString(process.env.OPERATOR_ID);
const operatorKey = PrivateKey.fromString(process.env.OPERATOR_KEY);

// See README.md for more info
const pools = [
  {
    pairName: 'Reuben Wrapped Hbar LP',
    pairAddress: '0x2296620dE98cB02A48DaDB339Bb11a1C9Fa92f43',
  },
  {
    pairName: 'USD Coin USD Coin LP',
    pairAddress: '0xf4D8e05ce43BEC2179A7bdc1313DC56B16Edd96A',
  },
];

const farms = [
  {
    address: '0x000000000000000000000000000000000014371C',
  },
  {
    address: '0x0000000000000000000000000000000000143706',
  },
];

// Init client
const client = Client.forMainnet().setOperator(operatorId, operatorKey);

async function updateContractExpiry(contractId: string, days: number) {
  //Create the transaction
  const transaction = await new ContractUpdateTransaction()
    .setContractId(contractId)
    .setExpirationTime(
      Timestamp.generate().plusNanos(days * 24 * 60 * 60 * 1000000000)
    )
    .freezeWith(client);

  //Sign the transaction with the client operator private key and submit to a Hedera network
  const txResponse = await transaction.execute(client);

  //Request the receipt of the transaction
  const receipt = await txResponse.getReceipt(client);

  //Get the consensus status of the transaction
  const transactionStatus = receipt.status;

  console.log(
    'The consensus status of the transaction is ' + transactionStatus
  );
}

async function getHederaIds(dataToExtract: any, addressProp: any) {
  const extractedData = [];
  for (let i = 0; i < dataToExtract.length; i++) {
    const response = await axios(
      `https://mainnet-public.mirrornode.hedera.com/api/v1/contracts/${dataToExtract[i][addressProp]}`
    );
    const { data } = response;
    const { contract_id } = data;

    extractedData.push(contract_id);
  }

  return extractedData;
}

async function main() {
  // Mainnet ids for Factories and Router
  const dexFactory = '0.0.1262116';
  const dexRouter = '0.0.1262126';
  const yfFactory = '0.0.1262136';

  const poolIds = await getHederaIds(pools, 'pairAddress');
  const farmIds = await getHederaIds(farms, 'address');

  console.log('poolIds', poolIds);
  console.log('farmIds', farmIds);

  const days = 91;

  // Extend one by one contracts
  /*
  const contractId = '';
  console.log(`Extending contract for id ${contractId}...`);
  await updateContractExpiry(contractId, days);
  console.log('✅ Contract extended!');
  */

  // Extend all pool contracts
  /*
  for (let i = 0; i < poolIds.length; i++) {
    console.log(`Extending contract for id ${poolIds[i]}...`);
    await updateContractExpiry(poolIds[i], days);
    console.log('✅ Contract extended!');
  }
  */

  // Extend all farms contracts
  /*
  for (let i = 0; i < farmIds.length; i++) {
    console.log(`Extending contract for id ${farmIds[i]}...`);
    await updateContractExpiry(farmIds[i], days);
    console.log('✅ Contract extended!');
  }
  */
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

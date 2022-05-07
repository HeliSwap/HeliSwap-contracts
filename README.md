<div align="center">

# HeliSwap Contracts

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

</div>

## Development

2. `git clone`
3. `cp config.sample.ts config.ts`
4. `npm install`
5. `npx hardhat compile`

### ECDSA Account

hardhat & hethers require the usage of ECDSA Accounts. In order to create such the following must be executed:
```
npx hardhat createAccount \
    --hedera-network {NETWORK} \
    --account {ID} \
    --pk {ED2559_PK} \
    --balance 100
```
Configure hardhat to use the newly created ECDSA Account by placing the `Account` and `ECDSA` private key in 
`config.ts` under `{NETWORK}` accounts.

Example:
```
previewnet: {
    accounts: [
        {
            "account": "0.0.NUM",
            "privateKey": "0x.."
        }
    ]
}
```

**Note**

Sensitive information such as deployment PKs are part of the `config.ts` file which is git ignored. 

## Scripts

**Compiling**

`npx hardhat compile`

**Running Unit Tests**

`npm run test` or `npx hardhat test`

By default `gas reporter` is turned on. You will see summary of the `min`, `max` and `avg` gas consumptions.

**Deployment**

`npx hardhat deploy`
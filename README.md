<div align="center">

# HeliSwap Contracts

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

</div>

This project is a template project consisting of:
- Hardhat setup + usage of hardhat `tasks`
- Typescript support
- GitHub actions for running compilation and tests 
- npm scripts for `compilation`, `tests`, `gas reporting` and `coverage`
- Running `slither` static analyser

## Development

2. `git clone`
3. `cp config.sample.ts config.ts`
4. `npm install`
5. `npx hardhat compile`

### ECDSA Account

hardhat & hethers require the usage of ECDSA Accounts. In order to create such the following must be executed:
```
  npx hardhat createAccount --hedera-network {NETWORK} --account {ID} --pk {ED2559_PK} --balance 100
```
Configure hardhat to use the newly created ECDSA Account by placing the `Account` and `ECDSA` private key in 
`config.ts` under `{NETWORK}` accounts.

Example:
```json
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

**Running Tests with Coverage**

`npm run coverage` or `npx hardhat coverage --solcoverjs .solcover.ts`

**Running Slither**

`npm run slither` or `slither .`

You must have slither installed. You can do that by executing `pip3 install slither-analyzer`

**Deployment**

`npx hardhat deploy`
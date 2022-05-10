<div align="center">

# Project Name

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![UnitTests](https://github.com/LimeChain/SmartContracts-Template/actions/workflows/unit-tests.yaml/badge.svg?branch=main)](https://github.com/LimeChain/SmartContracts-Template/actions/workflows/unit-tests.yaml)

</div>

This project is a template project consisting of:
- Hardhat setup + usage of hardhat `tasks`
- Typescript support
- GitHub actions for running compilation and tests 
- npm scripts for `compilation`, `tests`, `gas reporting` and `coverage`
- Running `slither` static analyser

## Setup

1. Create repository from this template
2. `git clone`
3. `cp config.sample.ts config.ts`
4. `npm install`
5. After the first GitHub Actions run, update the Unit Tests badge (currently points to the Template repository)

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


**Notes and steps**

##### Notes
- use previewnet for now
- the `marked` sections below are hardhat tasks with example arguments. 

##### Steps

0. Generate accounts via `createAccounts`. (OPTIONAL)


1. Deploy tokens (**HTS** or **ERC20**) to the network via `deployTokens` or `deployTokensERC20`
2. Deploy contracts to the network via `deploy --whbar 0xWhbarAddress`
3. Create a pair between those tokens with `createPair --factory 0xFactoryAddr --token1 0xToken1 --token2 0xToken1`
4. Assert the pair exists with `getContractInfo --addr 0xPairAddress`
5. Approve expenditure of tokens with `approve`. Must be done for all the accounts and for all the tokens (6 approves max).
6. Add liquidity with the `addLiquidity --router 0xRouterAddr --token1 0xToken1 --token2 0xToken2` script
7. Perform a swap with `swap --router 0xRouter --token1 0xToken1 --token2 0xToken2` ( you may have to do `5.` again)
8. TODO: remove liquidity

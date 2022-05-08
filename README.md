<div align="center">

# HeliSwap Contracts

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

</div>

## Development

Setup your Development environment by performing the following steps:
1. `git clone`
2. `cp config.sample.ts config.ts`
3. `npm install`
4. `npx hardhat compile`

#### ECDSA Account

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

## Deployment Steps

**Prerequisite**

You have created and configured an ECDSA account as deployer

1. Deploy WHBAR
```shell
npx hardhat deploy-whbar
```
2. Deploy the Factory & Router
```shell
npx hardhat deploy --whbar {WHBAR_EVM_ADDRESS}
```

## Utility Scripts

1. Create ECDSA Account
```shell
npx hardhat createAccount \
  --hedera-network {NETWORK} \
  --account {ID} \
  --pk {ED2559_PK} \
  --balance {INITIAL_BALANCE}
```

2. Create HTS Token
```shell
npx hardhat createHTS --hedera-network {NETWORK} --name {NAME} --symbol {SYMBOL}          
```

3. Deploy ERC20 Token
```shell
npx hardhat deployERC20 --name {NAME} --symbol {SYMBOL}
```

## Interaction Scripts

1. Create Pair (TODO)
2. Add Liquidity
```shell
npx hardhat addLiquidity
    --router {ROUTER} \
    --token0 {TOKEN_0} --token1 {TOKEN_1} \
    --amount0 {AMOUNT_0} --amount1 {AMOUNT_1}
```
3. Remove Liquidity (TODO)
4. Add Liquidity HBAR (TODO)
5. Remove Liquidity HBAR (TODO)
6. Swap (TODO)
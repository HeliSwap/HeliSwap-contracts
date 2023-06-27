<div align="center">

# HeliSwap

[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)

</div>

HeliSwap [core](./contracts/core) and [periphery](./contracts/periphery) contracts are forks of Uniswap V2 [core](https://github.com/Uniswap/v2-core) and
[periphery](https://github.com/Uniswap/v2-periphery) repositories. The contracts are tailored to deployment on
[Hedera Hashgraph](https://hedera.com/) and thus HeliSwap supports both `HTS` and native to the Smart Contract
Service `ERC20` deployed tokens.

HeliSwap contracts are non-upgradeable and thus
immutable. For detailed information of how the contracts work, you
can go to [Uniswap Docs](https://docs.uniswap.org/).

**Changes from Uniswap V2**

- After Pair creation, in the initialisation phase, the newly created Pair associates itself through [HIP-206](https://hips.hedera.com/hip/hip-206) to the 2
  pair
  tokens.
- Additional metadata is emitted in events to compensate for the lack of free `view` functions.

**Mainnet Deployment Addresses**

- `HeliSwapFactory`: `0x0000000000000000000000000000000000134224`
- `HeliSwapV2Router02`: `0x00000000000000000000000000000000002cc9B2`

**Testnet Deployment Addresses**

- `HeliSwapFactory`: `0x000000000000000000000000000000000000212d`
- `HeliSwapV2Router02`: `0x000000000000000000000000000000000000212f`

## Local Development

Set up your Development environment by performing the following steps:

1. `git clone`
2. `cp config.sample.ts config.ts`
3. `npm install`
4. `npx hardhat compile`

Deployment, interactions and utilities scripts are defined as `hardhat` tasks and can be run through [package.
json](./package.json).

## Scripts

Install dependencies:

```bash
npm install
```

You can run contracts tests with:

```bash
npx hardhat test
```

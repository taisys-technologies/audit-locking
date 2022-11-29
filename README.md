# Audit Locking

The purpose of this contract is to slowly release an amount of asset to a user after an assignated period of time.

The following are explanations for some user scenarios and the contract functions.

## Contract Scenario Description

- Releasing process

By the time timer being started by the governance, the locking contract records its assignated ERC20 token balance. After the first _lockingPeriods_ of periods after the timer starts, the locking contract begins to unlock. For the next _withdrawPeriods_ of periods, the recorded fund is unlocked per period linearly in proportion to periods lapsed. The assignated user can at most claim the unlocked amount.

## Function Description

- onlyGovernance

Modifier that accepts only transactions from the assigned governance.

</br>

- onlyBeneficiary

Modifier that accepts only transactions from the assigned beneficiary.

</br>

- setPendingGovernance **onlyGovernance**

Sets the pending governance. The governance changes after `acceptPendingGovernance` being called by the set pending governance.

</br>

- acceptGovernance

This method can only be called by the pending governance set by the function, `setPendingGovernance`. The caller becomes the governance.

</br>

- startTimer **onlyGovernance**

Starts the timer; records the balance to be locked; assigns the beneficiary.

</br>

- withdraw **onlyBeneficiary**

Withdraws an amount from the unlocked funds. Withdraws all if the unlocked amount were not enough.

</br>

- withdrawable

Gets the remaining unlocked fund.

</br>

## Document

- [Notion](https://nonstop-krypton-90d.notion.site/Taisys-589a8731e1db4565beb2c31c0f53f479)
- [Audit Report](./audit/)

## Test

### Setup

```bash
npm install
```

### Run

```bash
# run all tests
npx hardhat test

# run single test
npx hardhat test ${TEST_FILE_PATH}

# run tests with coverage report
npx hardhat coverage
```

## Static Analysis

[Slither Github](https://github.com/crytic/slither)

```bash
slither .
```

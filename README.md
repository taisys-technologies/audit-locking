# Locking Contract Document

- [setPendingGovernance](#setPendingGovernance)<span style="color:red">\*transaction</span>
- [acceptGovernance](#acceptGovernance)<span style="color:red">\*transaction</span>
- [startTimer](#startTimer)<span style="color:red">\*transaction</span>
- [withdraw](#withdraw) <span style="color:red">\*transaction</span>
- [withdrawable](#withdrawable)

## `setPendingGovernance`

Sets the new pending governance.

### Format

```javascript
.setPendingGovernance(pendingGovernance)
```

### Input

> - pendingGovernance: `address`

### Output

> none

### Event

> `PendingGovernanceUpdated(pendingGovernance: address)`

<br />

[Back To Top](#locking-contract-document)

---

<br />

## `acceptGovernance`

Accepts to be the new governance.

### Format

```javascript
.acceptGovernance()
```

### Input

> none

### Output

> none

### Event

> `GovernanceUpdated(pendingGovernance: address)`

<br />

[Back To Top](#locking-contract-document)

___

<br />

## `startTimer`

Sets the beneficiary of the locking contract and starts the timer for it.

### Format

```javascript=
.startTimer(time, beneficiary)
```

### Input

> - time: `uint256`
> - beneficiary: `address`

### Output

> none

### Event

> `TimerStarted(time: uint256, beneficiary: address)`

<br />

[Back To Top](#locking-contract-document)

___

<br />

## `withdraw`

Withdraws tokens from the locking contract.

### Format

```javascript=
.withdraw(amount)
```

### Input

> - amount: `uint256`

### Output

> none

### Event

> `TokenWithdrawn(beneficiary: address, amount: uint256)`

<br />

[Back To Top](#locking-contract-document)

___

<br />

## `withdrawable`

Gets the maximum withdrawable amount of token by the time of calling.

### Format

```javascript=
.withdrawable()
```

### Input

> none

### Output

> - amount: `uint256`: the maximum `${amount}` of token the `msg.sender` can withdraw

<br />

[Back To Top](#locking-contract-document)

___

<br />

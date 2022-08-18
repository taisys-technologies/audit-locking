// SPDX-License-Identifier: MIT

pragma solidity 0.8.4;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract Locking is ReentrancyGuard {
    using SafeERC20 for IERC20;

    event TimerStarted(uint256 _time, address _beneficiary);

    // event TokenDeposited(address _beneficiary, uint256 _amount);

    event TokenWithdrawn(address _beneficiary, uint256 _amount);

    event PendingGovernanceUpdated(address pendingGovernance);

    event GovernanceUpdated(address governance);

    address public governance;

    address public pendingGovernance;

    // mapping(address => uint256) depositOf;
    uint256 totalDeposit;

    // mapping(address => uint256) withdrawn;
    uint256 totalWithdrawn;

    IERC20 erc20Token;

    uint256 startingTime;

    address public beneficiary;

    uint256 public lockingPeriods;

    uint256 public withdrawPeriods;

    uint256 public periodLength;

    constructor(
        address _governance,
        IERC20 _erc20Token,
        uint256 _lockingPeriods,
        uint256 _withdrawPeriods,
        uint256 _periodLength
    ) {
        require(
            _governance != address(0),
            "Locking: governance address cannot be 0x0"
        );
        require(
            address(_erc20Token) != address(0),
            "Locking: erc20Token cannot be 0x0"
        );
        require(_periodLength != 0, "Locking: periodLength cannot be 0");
        governance = _governance;
        erc20Token = _erc20Token;
        lockingPeriods = _lockingPeriods;
        withdrawPeriods = _withdrawPeriods;
        periodLength = _periodLength;
    }

    modifier onlyGovernance() {
        require(msg.sender == governance, "Locking: only governance");
        _;
    }

    modifier onlyBeneficiary() {
        require(msg.sender == beneficiary, "Locking: only beneficiary");
        _;
    }

    /// @dev Sets the governance.
    ///
    /// This function can only called by the current governance.
    ///
    /// @param _pendingGovernance the new pending governance.
    function setPendingGovernance(address _pendingGovernance)
        external
        onlyGovernance
    {
        require(
            _pendingGovernance != address(0),
            "StakingPools: pending governance address cannot be 0x0"
        );
        pendingGovernance = _pendingGovernance;

        emit PendingGovernanceUpdated(_pendingGovernance);
    }

    function acceptGovernance() external {
        require(
            msg.sender == pendingGovernance,
            "StakingPools: only pending governance"
        );

        governance = pendingGovernance;

        emit GovernanceUpdated(pendingGovernance);
    }

    function startTimer(uint256 _time, address _beneficiary) external onlyGovernance {
        require(startingTime == 0, "Locking: timer already started");
        require(
            block.timestamp <= _time,
            "Locking: timer can't start at the past"
        );
        totalDeposit = erc20Token.balanceOf(address(this));
        require(totalDeposit > 0, "Locking: no deposit yet for the beneficiary");

        startingTime = _time;
        beneficiary = _beneficiary;

        emit TimerStarted(_time, _beneficiary);
    }

    function withdraw(uint256 _amount) external onlyBeneficiary nonReentrant {
        uint256 _amount_max = withdrawable();
        require(_amount_max > 0, "Locking: cannot withdraw yet");
        if (_amount > _amount_max) _amount = _amount_max;
        totalWithdrawn += _amount;
        erc20Token.safeTransfer(msg.sender, _amount);
        if (totalWithdrawn == totalDeposit) {
            totalDeposit = 0;
        }

        emit TokenWithdrawn(msg.sender, _amount);
    }

    function withdrawable() public view returns (uint256) {
        if (block.timestamp <= startingTime) return 0;
        if (totalDeposit == 0) return 0;
        uint256 _periods = (block.timestamp - startingTime) / periodLength;
        if (_periods <= lockingPeriods) return 0;
        uint256 _amount = ((_periods - lockingPeriods) * totalDeposit) /
            withdrawPeriods;
        if (_amount > totalDeposit) _amount = totalDeposit;
        return _amount - totalWithdrawn;
    }
}

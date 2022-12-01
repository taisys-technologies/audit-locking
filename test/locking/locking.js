const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("locking", function () {
  // accounts
  let admin, user, user2;
  // contracts
  let lockingContract, tokenContract;
  // constructor variables
  let lockPeriod = 3, withdrawPeriod = 5, periodTime = 1e5, mintAmount = 100000;
  // utils
  let tx;
  const zeroAddr = "0x0000000000000000000000000000000000000000";

  const getNow = async function () {
      const blockNumBefore = await ethers.provider.getBlockNumber();
      const blockBefore = await ethers.provider.getBlock(blockNumBefore);
      return (blockBefore.timestamp.toString())
  }
  beforeEach(async function () {
    [admin, user, user2] = await ethers.getSigners();
    const lockingFactory = await ethers.getContractFactory('Locking');
    const tokenFactory = await ethers.getContractFactory('ERC20Mock');

    // deploy opWhitelist and devWhitelist
    tokenContract = await tokenFactory.deploy("MockName", "gen");
    await tokenContract.deployed(admin.address);
    lockingContract = await lockingFactory.deploy(
      admin.address,
      tokenContract.address,
      lockPeriod,
      withdrawPeriod,
      periodTime
    );
    await lockingContract.deployed();
    tokenContract.connect(admin);
    lockingContract.connect(admin);
  });

  describe("initializing", function () {
    let tmpTime;
    it("Positive", async function () {
      tokenContract.connect(admin);
      lockingContract.connect(admin);
      await tokenContract.mint(lockingContract.address, mintAmount);
      await expect(
        await tokenContract.balanceOf(lockingContract.address))
        .to.equal(mintAmount);
      let tmpTime = await getNow() + 10000;
      await lockingContract.startTimer(tmpTime, user.address)
      await expect(
        await lockingContract.startingTime()
      ).to.equal(tmpTime);
      await expect(
        await lockingContract.beneficiary()
      ).to.equal(user.address);
    });
    context("when setting zero address", () => {
      it("reverts", async function() {
        const reverted = "Locking: beneficiary cannot be 0x0";
        lockingContract.connect(admin);
        let tmpTime = await getNow() + 10000;
        await expect(
          lockingContract.startTimer(tmpTime, zeroAddr)
        ).revertedWith(reverted);
      });
    });
    context("when timer too early", () => {
      it("reverts", async function() {
        const reverted = "Locking: timer can't start at the past";
        tmpTime = await getNow() - 10000;
        await expect(
          lockingContract.startTimer(tmpTime, user.address)
        ).revertedWith(reverted);
      });
    });
    context("when no fund is set",  () => {
      it("reverts", async function() {
        const reverted = "Locking: no deposit yet for the beneficiary";
        lockingContract.connect(admin);
        let tmpTime = await getNow() + 10000;
        await expect(
          lockingContract.startTimer(tmpTime, user.address)
        ).revertedWith(reverted);
      });
    })
  });

  describe.only("Successfaul withdraw", function () {
    let tmpTime;
    beforeEach(async function () {
      tokenContract.connect(admin);
      lockingContract.connect(admin);
      await tokenContract.mint(lockingContract.address, mintAmount);
      tmpTime = parseInt(await getNow()) + parseInt(10000);
      console.log(tmpTime);
      await lockingContract.startTimer(tmpTime, user.address);
      tmpTime = parseInt(tmpTime) + 10;
    });

    it("withdraw after total unlock", async function() {
      let periodsPassed = lockPeriod + withdrawPeriod + 2;
      tmpTime = parseInt(tmpTime) + parseInt(periodsPassed * periodTime);
      console.log(tmpTime);
      await ethers.provider.send(
        "evm_setNextBlockTimestamp",
        [tmpTime]
      );
      tx = await lockingContract.connect(user).withdraw(mintAmount + 10);
      await tx.wait();

      expect(await lockingContract.totalDeposit()).to.equal(0);
      expect(await tokenContract.balanceOf(lockingContract.address)).to.equal(0);
      expect(await tokenContract.balanceOf(user.address)).to.equal(mintAmount);
    })
    it("withdraw when unlocking", async function() {
      let withdrawAmount = 100;
      let periodsPassed = lockPeriod + 1;
      tmpTime = parseInt(tmpTime) + parseInt(periodsPassed * periodTime);
      console.log(tmpTime);
      await ethers.provider.send(
        "evm_setNextBlockTimestamp",
        [tmpTime]
      );
      // partial withdraw
      tx = await lockingContract.connect(user).withdraw(withdrawAmount);
      await tx.wait();

      expect(await lockingContract.totalDeposit()).to.equal(mintAmount);
      expect(await tokenContract.balanceOf(lockingContract.address))
        .to.equal(mintAmount - withdrawAmount);
      expect(await tokenContract.balanceOf(user.address)).to.equal(withdrawAmount);

      // withdraw all
      tx = await lockingContract.connect(user).withdraw(mintAmount);
      await tx.wait();
      expect(await lockingContract.totalDeposit()).to.equal(mintAmount);
      expect(await tokenContract.balanceOf(lockingContract.address))
        .to.equal(mintAmount / withdrawPeriod * (withdrawPeriod - 1));
      expect(await tokenContract.balanceOf(user.address))
        .to.equal(mintAmount / withdrawPeriod);
    })
    context("when caller is not beneficiary", () => {
      it("reverts", async function() {
        reverted = "Locking: only beneficiary";
        expect(
          lockingContract.withdraw(mintAmount + 10)
        ).revertedWith(reverted);
      });
    });
    context("when fund is still locked", () => {
      it("reverts", async function() {
        reverted = "Locking: cannot withdraw yet";
        // calls before the timer starts
        expect(
          lockingContract.connect(user).withdraw(mintAmount + 10)
        ).revertedWith(reverted);
        // calls right after the timer started
        await ethers.provider.send(
          "evm_setNextBlockTimestamp",
          [tmpTime]
        );
        expect(
          lockingContract.connect(user).withdraw(mintAmount + 10)
        ).revertedWith(reverted);
        // calls after a few periods before locking ends
        let periodsPassed = lockPeriod - 1;
        tmpTime += periodsPassed * periodTime;
        await ethers.provider.send(
          "evm_setNextBlockTimestamp",
          [tmpTime]
        );
        expect(
          lockingContract.connect(user).withdraw(mintAmount + 10)
        ).revertedWith(reverted);
      });
    });
  });
});

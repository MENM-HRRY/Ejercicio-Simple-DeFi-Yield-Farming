const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("FarmingContract", function () {
    let FarmToken;
    let farmToken;
    let FarmingContract;
    let farmingContract;
    let owner;
    let addr1;
    let addr2;
    
    const INITIAL_REWARD_RATE = ethers.utils.parseEther("100");
    const MIN_REWARD_RATE = ethers.utils.parseEther("50");
    const MAX_REWARD_RATE = ethers.utils.parseEther("200");
    const WITHDRAWAL_FEE = 250; // 2.5%

    beforeEach(async function () {
        [owner, addr1, addr2] = await ethers.getSigners();

        // Deploy token
        FarmToken = await ethers.getContractFactory("FarmToken");
        farmToken = await FarmToken.deploy();
        await farmToken.deployed();

        // Deploy farming contract
        FarmingContract = await ethers.getContractFactory("FarmingContract");
        farmingContract = await FarmingContract.deploy(
            farmToken.address,
            farmToken.address,
            INITIAL_REWARD_RATE,
            MIN_REWARD_RATE,
            MAX_REWARD_RATE,
            WITHDRAWAL_FEE
        );
        await farmingContract.deployed();

        // Transfer tokens for rewards
        await farmToken.transfer(farmingContract.address, ethers.utils.parseEther("1000000"));
        
        // Transfer tokens to users for testing
        await farmToken.transfer(addr1.address, ethers.utils.parseEther("1000"));
        await farmToken.transfer(addr2.address, ethers.utils.parseEther("1000"));
    });

    describe("Staking and Rewards", function () {
        it("Should allow users to stake LP tokens and earn rewards", async function () {
            const stakeAmount = ethers.utils.parseEther("100");
            
            // Approve and stake
            await farmToken.connect(addr1).approve(farmingContract.address, stakeAmount);
            await farmingContract.connect(addr1).deposit(stakeAmount);
            
            // Mine some blocks
            await time.advanceBlocks(10);
            
            // Check pending rewards
            const pendingRewards = await farmingContract.pendingRewards(addr1.address);
            expect(pendingRewards).to.be.gt(0);
        });

        it("Should distribute rewards correctly to multiple users", async function () {
            const stakeAmount = ethers.utils.parseEther("100");
            
            // User 1 stakes
            await farmToken.connect(addr1).approve(farmingContract.address, stakeAmount);
            await farmingContract.connect(addr1).deposit(stakeAmount);
            
            // Mine some blocks
            await time.advanceBlocks(5);
            
            // User 2 stakes
            await farmToken.connect(addr2).approve(farmingContract.address, stakeAmount);
            await farmingContract.connect(addr2).deposit(stakeAmount);
            
            // Mine more blocks
            await time.advanceBlocks(5);
            
            const rewards1 = await farmingContract.pendingRewards(addr1.address);
            const rewards2 = await farmingContract.pendingRewards(addr2.address);
            
            expect(rewards1).to.be.gt(rewards2);
        });

        it("Should allow users to claim rewards", async function () {
            const stakeAmount = ethers.utils.parseEther("100");
            
            // Stake tokens
            await farmToken.connect(addr1).approve(farmingContract.address, stakeAmount);
            await farmingContract.connect(addr1).deposit(stakeAmount);
            
            // Mine blocks
            await time.advanceBlocks(10);
            
            // Get initial balance
            const initialBalance = await farmToken.balanceOf(addr1.address);
            
            // Harvest rewards
            await farmingContract.connect(addr1).harvest();
            
            // Check new balance
            const newBalance = await farmToken.balanceOf(addr1.address);
            expect(newBalance).to.be.gt(initialBalance);
        });

        it("Should allow emergency withdrawal", async function () {
            const stakeAmount = ethers.utils.parseEther("100");
            
            // Stake tokens
            await farmToken.connect(addr1).approve(farmingContract.address, stakeAmount);
            await farmingContract.connect(addr1).deposit(stakeAmount);
            
            // Emergency withdraw
            await farmingContract.connect(addr1).emergencyWithdraw();
            
            const userInfo = await farmingContract.userInfo(addr1.address);
            expect(userInfo.amount).to.equal(0);
            expect(userInfo.isStaking).to.be.false;
        });
    });

    describe("Owner Functions", function () {
        it("Should allow owner to update reward rate within limits", async function () {
            const newRate = ethers.utils.parseEther("150");
            await farmingContract.setRewardPerBlock(newRate);
            expect(await farmingContract.rewardPerBlock()).to.equal(newRate);
        });

        it("Should not allow setting reward rate outside limits", async function () {
            const tooHighRate = ethers.utils.parseEther("250");
            await expect(
                farmingContract.setRewardPerBlock(tooHighRate)
            ).to.be.revertedWith("Invalid reward rate");
        });

        it("Should allow owner to withdraw collected fees", async function () {
            const stakeAmount = ethers.utils.parseEther("100");
            
            // Stake and withdraw to generate fees
            await farmToken.connect(addr1).approve(farmingContract.address, stakeAmount);
            await farmingContract.connect(addr1).deposit(stakeAmount);
            await farmingContract.connect(addr1).withdraw(stakeAmount);
            
            const initialBalance = await farmToken.balanceOf(owner.address);
            await farmingContract.withdrawFees();
            const newBalance = await farmToken.balanceOf(owner.address);
            
            expect(newBalance).to.be.gt(initialBalance);
        });
    });
});
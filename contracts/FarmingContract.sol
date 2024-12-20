// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/IFarmingContract.sol";
import "./libraries/FarmingMath.sol";

contract FarmingContract is IFarmingContract, ReentrancyGuard, Ownable {
    using FarmingMath for uint256;

    // Estado del contrato
    IERC20 public stakingToken;
    IERC20 public rewardToken;
    uint256 public rewardPerBlock;
    uint256 public lastRewardBlock;
    uint256 public accRewardPerShare;
    uint256 public minRewardRate;
    uint256 public maxRewardRate;
    uint256 public withdrawalFee; // Base 10000 (e.g., 250 = 2.5%)
    uint256 public collectedFees;
    
    // Mapeo de información de usuarios
    mapping(address => UserInfo) public userInfo;

    // Modifiers
    modifier onlyStaker() {
        require(userInfo[msg.sender].isStaking, "Not a staker");
        _;
    }

    modifier validRewardRate(uint256 _rate) {
        require(_rate >= minRewardRate && _rate <= maxRewardRate, "Invalid reward rate");
        _;
    }

    constructor(
        IERC20 _stakingToken,
        IERC20 _rewardToken,
        uint256 _rewardPerBlock,
        uint256 _minRewardRate,
        uint256 _maxRewardRate,
        uint256 _withdrawalFee
    ) {
        stakingToken = _stakingToken;
        rewardToken = _rewardToken;
        rewardPerBlock = _rewardPerBlock;
        minRewardRate = _minRewardRate;
        maxRewardRate = _maxRewardRate;
        withdrawalFee = _withdrawalFee;
        lastRewardBlock = block.number;
    }

    function updatePool() public {
        if (block.number <= lastRewardBlock) {
            return;
        }

        uint256 lpSupply = stakingToken.balanceOf(address(this));
        if (lpSupply == 0) {
            lastRewardBlock = block.number;
            return;
        }

        uint256 multiplier = block.number - lastRewardBlock;
        uint256 reward = multiplier * rewardPerBlock;
        accRewardPerShare += (reward * 1e12) / lpSupply;
        lastRewardBlock = block.number;
    }

    function deposit(uint256 _amount) external nonReentrant {
        UserInfo storage user = userInfo[msg.sender];
        updatePool();
        
        if (user.amount > 0) {
            uint256 pending = FarmingMath.calculateRewards(
                user.amount,
                accRewardPerShare,
                user.rewardDebt
            );
            if (pending > 0) {
                user.pendingRewards += pending;
            }
        }

        if (_amount > 0) {
            stakingToken.transferFrom(msg.sender, address(this), _amount);
            user.amount += _amount;
            user.lastDeposit = block.timestamp;
            user.isStaking = true;
        }

        user.rewardDebt = user.amount * accRewardPerShare / 1e12;
        emit Deposit(msg.sender, _amount);
    }

    function withdraw(uint256 _amount) external nonReentrant onlyStaker {
        UserInfo storage user = userInfo[msg.sender];
        require(user.amount >= _amount, "Insufficient balance");
        
        updatePool();
        uint256 pending = FarmingMath.calculateRewards(
            user.amount,
            accRewardPerShare,
            user.rewardDebt
        );
        
        if (_amount > 0) {
            user.amount -= _amount;
            uint256 fee = FarmingMath.calculateFee(_amount, withdrawalFee);
            uint256 netAmount = _amount - fee;
            collectedFees += fee;
            stakingToken.transfer(msg.sender, netAmount);
        }

        if (pending > 0) {
            user.pendingRewards += pending;
        }

        user.rewardDebt = user.amount * accRewardPerShare / 1e12;
        user.isStaking = user.amount > 0;
        emit Withdraw(msg.sender, _amount);
    }

    function harvest() external nonReentrant onlyStaker {
        UserInfo storage user = userInfo[msg.sender];
        updatePool();
        
        uint256 pending = FarmingMath.calculateRewards(
            user.amount,
            accRewardPerShare,
            user.rewardDebt
        ) + user.pendingRewards;
        
        if (pending > 0) {
            user.pendingRewards = 0;
            uint256 fee = FarmingMath.calculateFee(pending, withdrawalFee);
            uint256 netReward = pending - fee;
            collectedFees += fee;
            rewardToken.transfer(msg.sender, netReward);
            emit Harvest(msg.sender, netReward);
        }

        user.rewardDebt = user.amount * accRewardPerShare / 1e12;
    }

    function emergencyWithdraw() external nonReentrant onlyStaker {
        UserInfo storage user = userInfo[msg.sender];
        uint256 amount = user.amount;
        user.amount = 0;
        user.rewardDebt = 0;
        user.pendingRewards = 0;
        user.isStaking = false;
        
        uint256 fee = FarmingMath.calculateFee(amount, withdrawalFee);
        uint256 netAmount = amount - fee;
        collectedFees += fee;
        stakingToken.transfer(msg.sender, netAmount);
        emit EmergencyWithdraw(msg.sender, netAmount);
    }

    // Funciones del propietario
    function setRewardPerBlock(uint256 _rewardPerBlock) 
        external 
        onlyOwner 
        validRewardRate(_rewardPerBlock) 
    {
        uint256 oldRate = rewardPerBlock;
        rewardPerBlock = _rewardPerBlock;
        emit RewardRateUpdated(oldRate, _rewardPerBlock);
    }

    function withdrawFees() external onlyOwner {
        uint256 amount = collectedFees;
        collectedFees = 0;
        stakingToken.transfer(msg.sender, amount);
        emit FeeCollected(amount);
    }

    // View functions
    function pendingRewards(address _user) external view returns (uint256) {
        UserInfo storage user = userInfo[_user];
        uint256 lpSupply = stakingToken.balanceOf(address(this));
        uint256 accRewardPerShareTemp = accRewardPerShare;
        
        if (block.number > lastRewardBlock && lpSupply != 0) {
            uint256 multiplier = block.number - lastRewardBlock;
            uint256 reward = multiplier * rewardPerBlock;
            accRewardPerShareTemp += (reward * 1e12) / lpSupply;
        }
        
        return FarmingMath.calculateRewards(
            user.amount,
            accRewardPerShareTemp,
            user.rewardDebt
        ) + user.pendingRewards;
    }
}
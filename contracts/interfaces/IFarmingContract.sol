// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

interface IFarmingContract {
    struct UserInfo {
        uint256 amount;         // Cantidad de tokens en staking
        uint256 rewardDebt;     // Recompensa debt
        uint256 lastDeposit;    // Timestamp del último depósito
        uint256 pendingRewards; // Recompensas pendientes
        bool isStaking;         // Estado de staking del usuario
    }

    event Deposit(address indexed user, uint256 amount);
    event Withdraw(address indexed user, uint256 amount);
    event Harvest(address indexed user, uint256 amount);
    event EmergencyWithdraw(address indexed user, uint256 amount);
    event RewardRateUpdated(uint256 oldRate, uint256 newRate);
    event FeeCollected(uint256 amount);
}
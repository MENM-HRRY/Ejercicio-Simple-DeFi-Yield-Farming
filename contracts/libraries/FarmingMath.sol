// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

library FarmingMath {
    function calculateRewards(
        uint256 amount,
        uint256 accRewardPerShare,
        uint256 rewardDebt
    ) internal pure returns (uint256) {
        return (amount * accRewardPerShare / 1e12) - rewardDebt;
    }

    function calculateFee(uint256 amount, uint256 feeRate) internal pure returns (uint256) {
        return (amount * feeRate) / 10000; // feeRate en base 10000 (e.g., 250 = 2.5%)
    }
}
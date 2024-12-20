import { ethers } from 'ethers';
import { PANCAKESWAP_ADDRESSES, GAS_LIMIT } from '../config/constants';
import MasterChefV2ABI from '../abis/MasterChefV2.json';

export class FarmService {
    constructor(signer) {
        this.signer = signer;
        this.masterChefContract = new ethers.Contract(
            PANCAKESWAP_ADDRESSES.MASTER_CHEF_V2,
            MasterChefV2ABI,
            signer
        );
    }

    async stake(pid, amount) {
        try {
            const tx = await this.masterChefContract.deposit(pid, amount, {
                gasLimit: GAS_LIMIT.STAKE
            });
            return await tx.wait();
        } catch (error) {
            console.error('Error al hacer stake:', error);
            throw error;
        }
    }

    async unstake(pid, amount) {
        try {
            const tx = await this.masterChefContract.withdraw(pid, amount, {
                gasLimit: GAS_LIMIT.UNSTAKE
            });
            return await tx.wait();
        } catch (error) {
            console.error('Error al hacer unstake:', error);
            throw error;
        }
    }

    async harvest(pid) {
        try {
            const tx = await this.masterChefContract.harvest(pid, this.signer.address, {
                gasLimit: GAS_LIMIT.HARVEST
            });
            return await tx.wait();
        } catch (error) {
            console.error('Error al cosechar recompensas:', error);
            throw error;
        }
    }

    async getUserInfo(pid, userAddress) {
        try {
            const userInfo = await this.masterChefContract.userInfo(pid, userAddress);
            return {
                amount: userInfo.amount,
                rewardDebt: userInfo.rewardDebt
            };
        } catch (error) {
            console.error('Error al obtener información del usuario:', error);
            throw error;
        }
    }

    async getPendingRewards(pid, userAddress) {
        try {
            return await this.masterChefContract.pendingCake(pid, userAddress);
        } catch (error) {
            console.error('Error al obtener recompensas pendientes:', error);
            throw error;
        }
    }
}
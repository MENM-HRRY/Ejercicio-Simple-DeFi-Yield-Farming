import { ethers } from 'ethers';

export const getProvider = () => {
    // Conectar con BSC
    return new ethers.providers.JsonRpcProvider('https://bsc-dataseed.binance.org/');
};

export const getSigner = (provider, privateKey) => {
    return new ethers.Wallet(privateKey, provider);
};

export const formatWei = (amount) => {
    return ethers.utils.formatEther(amount);
};

export const parseWei = (amount) => {
    return ethers.utils.parseEther(amount.toString());
};
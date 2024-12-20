import { getProvider, getSigner } from '../utils/web3Helper';
import { FarmService } from '../services/farmService';

async function main() {
    try {
        // Configuración inicial
        const provider = getProvider();
        const signer = getSigner(provider, process.env.PRIVATE_KEY);
        const farmService = new FarmService(signer);

        // Ejemplo de uso
        const pid = 1; // ID del pool de farming
        const userAddress = await signer.getAddress();

        // Obtener información del usuario
        const userInfo = await farmService.getUserInfo(pid, userAddress);
        console.log('Información del usuario:', userInfo);

        // Obtener recompensas pendientes
        const pendingRewards = await farmService.getPendingRewards(pid, userAddress);
        console.log('Recompensas pendientes:', pendingRewards);

    } catch (error) {
        console.error('Error en el ejemplo:', error);
    }
}

// No ejecutamos main() directamente para evitar ejecución accidental
const hre = require("hardhat");

async function main() {
  // Desplegamos el token de farming
  const FarmToken = await hre.ethers.getContractFactory("FarmToken");
  const farmToken = await FarmToken.deploy();
  await farmToken.deployed();
  console.log("FarmToken deployed to:", farmToken.address);

  // Configuración de recompensas por bloque (ejemplo: 100 tokens)
  const rewardPerBlock = hre.ethers.utils.parseEther("100");

  // Desplegamos el contrato de farming
  const FarmingContract = await hre.ethers.getContractFactory("FarmingContract");
  const farmingContract = await FarmingContract.deploy(
    farmToken.address, // Token para staking
    farmToken.address, // Token para recompensas (mismo token en este ejemplo)
    rewardPerBlock
  );
  await farmingContract.deployed();
  console.log("FarmingContract deployed to:", farmingContract.address);

  // Transferimos tokens al contrato de farming para recompensas
  const rewardAmount = hre.ethers.utils.parseEther("1000000");
  await farmToken.transfer(farmingContract.address, rewardAmount);
  console.log("Transferred reward tokens to farming contract");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
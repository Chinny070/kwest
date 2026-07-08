import { ethers } from "hardhat";

// Base Sepolia USDC address (Circle's official testnet USDC)
const USDC_BASE_SEPOLIA = process.env.USDC_ADDRESS || "0x036CbD53842c5426634e7929541eC2318f3dCF7e";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying KwestCore with account:", deployer.address);

  const KwestCore = await ethers.getContractFactory("KwestCore");
  const kwestCore = await KwestCore.deploy(USDC_BASE_SEPOLIA, deployer.address);
  await kwestCore.waitForDeployment();
  const address = await kwestCore.getAddress();

  console.log("KwestCore deployed to:", address);
  console.log("USDC address:", USDC_BASE_SEPOLIA);
  console.log("Fee recipient:", deployer.address);
  console.log("\nSet NEXT_PUBLIC_KWEST_CORE_ADDRESS=" + address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

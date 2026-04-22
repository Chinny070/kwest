// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {Kwest} from "../src/Kwest.sol";
import {MockUSDC} from "../src/MockUSDC.sol";

/**
 * @title DeployKwest
 * @notice Foundry deployment script for Kwest on Base Sepolia.
 *
 * Usage (Base Sepolia):
 *   forge script script/DeployKwest.s.sol:DeployKwest \
 *     --rpc-url $BASE_SEPOLIA_RPC_URL \
 *     --account deployer \
 *     --broadcast \
 *     --verify \
 *     --etherscan-api-key $BASESCAN_API_KEY \
 *     -vvvv
 *
 * Set DEPLOY_MOCK_USDC=true in .env to deploy MockUSDC (for testnet).
 * Set USDC_ADDRESS in .env to use real USDC (Base Sepolia: 0x036CbD53842c5426634e7929541eC2318f3dCF7e).
 */
contract DeployKwest is Script {
    // Base Sepolia USDC address
    address constant BASE_SEPOLIA_USDC = 0x036CbD53842c5426634e7929541eC2318f3dCF7e;

    function run() external {
        uint256 deployerPrivateKey = vm.envOr("PRIVATE_KEY", uint256(0));
        address deployerAddr;

        if (deployerPrivateKey != 0) {
            vm.startBroadcast(deployerPrivateKey);
            deployerAddr = vm.addr(deployerPrivateKey);
        } else {
            vm.startBroadcast();
            deployerAddr = msg.sender;
        }

        bool deployMockUsdc = vm.envOr("DEPLOY_MOCK_USDC", false);
        address usdcAddress;

        if (deployMockUsdc) {
            MockUSDC mockUsdc = new MockUSDC();
            usdcAddress = address(mockUsdc);
            console.log("MockUSDC deployed at:", usdcAddress);

            // Mint 10,000 USDC to deployer for testing
            mockUsdc.mint(deployerAddr, 10_000 * 1e6);
            console.log("Minted 10,000 MockUSDC to deployer");
        } else {
            usdcAddress = vm.envOr("USDC_ADDRESS", BASE_SEPOLIA_USDC);
            console.log("Using USDC at:", usdcAddress);
        }

        Kwest kwest = new Kwest(usdcAddress, deployerAddr);
        console.log("Kwest deployed at:", address(kwest));
        console.log("Owner:", deployerAddr);
        console.log("USDC:", usdcAddress);

        vm.stopBroadcast();

        // Output for .env
        console.log("\n=== Add to your .env ===");
        console.log("NEXT_PUBLIC_KWEST_ADDRESS=", address(kwest));
        console.log("NEXT_PUBLIC_USDC_ADDRESS=", usdcAddress);
    }
}

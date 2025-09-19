import type { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox-viem";
import "@nomicfoundation/hardhat-verify";
const { vars } = require("hardhat/config");

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.30",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    sepolia: {  // ✅ Fixed: lowercase network name
      url: 'https://eth-sepolia.g.alchemy.com/v2/_RLLnk2k_UkozPwgk-k2C', // ✅ Replace with your actual key
      accounts: [vars.get("PRIVATE_KEY")],
      chainId: 11155111,
    },
  },
  etherscan: {
    apiKey: {
      sepolia: vars.get("ETHERSCAN_API_KEY"), // ✅ Use real Etherscan API key
    },
  },
  sourcify: {
    enabled: false
  },
};

export default config;
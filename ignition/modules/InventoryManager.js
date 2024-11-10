// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

module.exports = buildModule("InventoryManager", (m) => {
  const inventoryManager = m.contract("InventoryManager", []);

  console.log("InventoryManager deployed at:");

  return { inventoryManager };
});

// npx hardhat ignition deploy ./ignition/modules/InventoryManager.js --network sepolia
// npx hardhat verify --network sepolia 0x164B0B8C6cD6b8aEA4f20c3BE7E3955aD2550aa8

// Successfully verified contract InventoryManager on the block explorer.
// https://sepolia.etherscan.io/address/0x164B0B8C6cD6b8aEA4f20c3BE7E3955aD2550aa8#code

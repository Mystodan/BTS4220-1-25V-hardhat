// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const hre = require("hardhat");
const { ethers } = require("hardhat");
const { v4: uuidv4 } = require("uuid");

async function main() {
  // Setup accounts and variables
  const [deployer] = await ethers.getSigners();

  // Deploy contract
  const TodoWeb3 = await ethers.getContractFactory("TodoWeb3");
  const todoWeb3 = await TodoWeb3.deploy();
  await todoWeb3.deployed();
  console.log(`Deployed task contract at: ${todoWeb3.address}`);

  // Creating a list of tasks
  // Now supports public/private tasks
  const tasks = [
    { content: "Create a video on GPT", is_private: false },
    { content: "Complete Dapp University course", is_private: true },
    { content: "Deploy a smart contract on Ethereum", is_private: false },
    { content: "Write a Solidity function for voting", is_private: false },
    { content: "Test a contract with Hardhat", is_private: false },
    { content: "Mint an NFT on Polygon", is_private: false },
    { content: "Set up a local blockchain with Ganache", is_private: false },
    { content: "Learn about zk-SNARKs", is_private: false },
    { content: "Implement ERC-20 token standard", is_private: false },
    { content: "Audit a DeFi protocol", is_private: false },
    { content: "Build a DEX UI in React", is_private: false },
    { content: "Integrate MetaMask wallet", is_private: false },
    { content: "Explore Layer 2 scaling solutions", is_private: false },
    { content: "Write a Chainlink oracle consumer", is_private: false },
    { content: "Create a DAO voting system", is_private: false },
    { content: "Research EIP-1559 and gas fees", is_private: false },
    { content: "Build a multisig wallet contract", is_private: false },
    { content: "Deploy a contract to Sepolia testnet", is_private: false },
    { content: "Read and parse blockchain event logs", is_private: false },
    { content: "Implement contract upgradeability", is_private: false },
    { content: "Study the Ethereum Virtual Machine", is_private: false },
    { content: "Create a token faucet for testnet", is_private: false },
    { content: "Read the morning newspaper", is_private: true },
    { content: "Tend to the garden", is_private: true },
    { content: "Go for a walk in the park", is_private: true },
    { content: "Call grandchildren on Sunday", is_private: true },
    { content: "Listen to classical music", is_private: true },
    { content: "Work on a jigsaw puzzle", is_private: true },
    { content: "Bake homemade bread", is_private: true },
    { content: "Write a letter to an old friend", is_private: true }
  ];

  // List tasks
  for (let i = 0; i < tasks.length; i++) {
    const uuid = uuidv4();
    let transaction = await todoWeb3.connect(deployer).createTask(uuid, tasks[i].content, tasks[i].is_private);
    await transaction.wait();
    console.log(`Created task${i + 1}: ${tasks[i].content} (private: ${tasks[i].is_private}, uuid: ${uuid})`);
  }
}

// This pattern is recommended to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

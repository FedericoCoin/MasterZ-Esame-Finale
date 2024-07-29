const hre = require("hardhat");
const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);

  // Deploy ERC20TokenFactory
  const ERC20TokenFactory = await ethers.getContractFactory("ERC20TokenFactory");
  const factory = await ERC20TokenFactory.deploy();

  await factory.waitForDeployment();
  const factoryAddress = await factory.getAddress();

  console.log("ERC20TokenFactory deployed to:", factoryAddress);

  // Deploy a token using the factory
  const name = "My Token";
  const symbol = "MTK";
  const initialSupply = ethers.parseEther("1000000");

  const tx = await factory.deployToken(name, symbol, initialSupply, deployer.address);
  const receipt = await tx.wait();

  const filter = factory.filters.TokenDeployed();
  const events = await factory.queryFilter(filter, receipt.blockNumber, receipt.blockNumber);

  if (events.length === 0) {
    throw new Error("TokenDeployed event not found");
  }

  const tokenAddress = events[0].args[0];
  console.log("ERC20Token deployed to:", tokenAddress);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
const hre = require("hardhat");
const { ethers, upgrades } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);

  // Deploy ERC20Token
  const ERC20Token = await ethers.getContractFactory("ERC20Token");
  const token = await upgrades.deployProxy(ERC20Token, [
    "My Token", 
    "MTK", 
    ethers.parseEther("1000000"), 
    deployer.address
  ], { initializer: 'initialize' });

  await token.waitForDeployment();
  const tokenAddress = await token.getAddress();

  console.log("ERC20Token deployed to:", tokenAddress);

  // Deploy ERC20TokenFactory
  const ERC20TokenFactory = await ethers.getContractFactory("ERC20TokenFactory");
  const factory = await ERC20TokenFactory.deploy();

  await factory.waitForDeployment();
  const factoryAddress = await factory.getAddress();

  console.log("ERC20TokenFactory deployed to:", factoryAddress);

  const implementationAddress = await upgrades.erc1967.getImplementationAddress(tokenAddress);
  console.log("ERC20Token implementation address:", implementationAddress);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
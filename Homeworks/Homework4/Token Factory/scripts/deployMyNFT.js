const hre = require("hardhat");
const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);

  // Deploy MyNFTTokenFactory
  const MyNFTTokenFactory = await ethers.getContractFactory("MyNFTTokenFactory");
  const factory = await MyNFTTokenFactory.deploy();

  await factory.waitForDeployment();
  const factoryAddress = await factory.getAddress();

  console.log("MyNFTTokenFactory deployed to:", factoryAddress);

  // Deploy a MyNFTToken using the factory
  const collName = "My NFT Collection";
  const collSym = "MNFT";
  
  const deployTx = await factory.deployNewNFTToken(collName, collSym, deployer.address);
  const receipt = await deployTx.wait();

  
  const event = receipt.logs.find(log => log.fragment.name === 'NFTTokenDeployed');
  const nftTokenAddress = event.args.tokenAddress;

  console.log("MyNFTToken deployed to:", nftTokenAddress);


  const MyNFTToken = await ethers.getContractFactory("MyNFTToken");
  const nftToken = MyNFTToken.attach(nftTokenAddress);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
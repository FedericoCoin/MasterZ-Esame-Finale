const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);

  const Card = await ethers.getContractFactory("Card");
  const card = await Card.deploy();
  await card.waitForDeployment();

  console.log("Card contract deployed to:", await card.getAddress());

  // Set the base URI
  const baseURI = "ipfs://QmVQG1RrJt7DUGKH9FtVHcTY8og2H8t7kywm36kH7dQc1c/";
  await card.setURI(baseURI);
  

 
}



main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
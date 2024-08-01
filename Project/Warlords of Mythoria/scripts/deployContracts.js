const { ethers, upgrades } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);

  // Deploy MythoriaToken
  const MythoriaToken = await ethers.getContractFactory("MythoriaToken");
  const mythoriaToken = await upgrades.deployProxy(MythoriaToken, [deployer.address]);
  await mythoriaToken.waitForDeployment();
  console.log("MythoriaToken deployed to:", await mythoriaToken.getAddress());

  // Deploy MythoriaCards
  const MythoriaCards = await ethers.getContractFactory("MythoriaCards");
  const baseURI = "ipfs://QmTX7ixaB9mYLgY5R85QwJHi1tLWkbbTAYUVUcEjmH8exY/";
  const mythoriaCards = await upgrades.deployProxy(MythoriaCards, [baseURI]);
  await mythoriaCards.waitForDeployment();
  console.log("MythoriaCards deployed to:", await mythoriaCards.getAddress());

  // Deploy DeckContract
  const DeckContract = await ethers.getContractFactory("DeckContract");
  const deckContract = await upgrades.deployProxy(DeckContract, [
    await mythoriaCards.getAddress(),
    await mythoriaToken.getAddress()
  ]);
  await deckContract.waitForDeployment();
  console.log("DeckContract deployed to:", await deckContract.getAddress());

  // Deploy CardMarketplace
  const CardMarketplace = await ethers.getContractFactory("CardMarketplace");
  const cardMarketplace = await upgrades.deployProxy(CardMarketplace, [
    await mythoriaCards.getAddress(),
    await mythoriaToken.getAddress()
  ]);
  await cardMarketplace.waitForDeployment();
  console.log("CardMarketplace deployed to:", await cardMarketplace.getAddress());

  // Set up initial configurations
  await mythoriaCards.setBaseURI(baseURI);
  console.log("Base URI set for MythoriaCards");

  console.log("Deployment and initial setup completed");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
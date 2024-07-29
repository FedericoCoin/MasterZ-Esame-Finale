const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);

  // Deploy CryptoDevToken
  const CryptoDevToken = await hre.ethers.getContractFactory("CryptoDevToken");
  const cryptoDevToken = await CryptoDevToken.deploy();
  await cryptoDevToken.deployed();
  console.log("CryptoDevToken deployed to:", cryptoDevToken.address);

  // Deploy DEX
  const DEX = await hre.ethers.getContractFactory("DEX");
  const dex = await DEX.deploy(cryptoDevToken.address);
  await dex.deployed();
  console.log("DEX deployed to:", dex.address);

  // Approve DEX to spend tokens
  const approveTx = await cryptoDevToken.approve(dex.address, hre.ethers.utils.parseEther("1000000"));
  await approveTx.wait();
  console.log("DEX approved to spend CryptoDevTokens");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
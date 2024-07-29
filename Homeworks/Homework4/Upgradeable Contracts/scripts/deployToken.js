const { ethers, upgrades } = require("hardhat");
const fs = require('fs');

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance));

  const tokenName = "My Custom Token";
  const tokenSymbol = "MCT";
  const totSupply = ethers.parseEther("1000000");

  const IS_UPGRADE = process.env.IS_UPGRADE === 'true';
  const PROXY_ADDRESS = process.env.PROXY_ADDRESS || "";

  if (IS_UPGRADE) {
    console.log('Token is being upgraded...');
    console.log(`Token address for upgrade: ${PROXY_ADDRESS}`);

    if (!PROXY_ADDRESS || !ethers.isAddress(PROXY_ADDRESS)) {
      throw new Error(`Invalid proxy address: ${PROXY_ADDRESS}`);
    }

    try {
      const Token2 = await ethers.getContractFactory("Token2");
      const upgraded = await upgrades.upgradeProxy(PROXY_ADDRESS, Token2);
      await upgraded.waitForDeployment();
      const upgradedAddress = await upgraded.getAddress();
      console.log("Token upgraded to Token2 at:", upgradedAddress);
    } catch (error) {
      console.error("Error during upgrade:", error);
      throw error;
    }
  } else {
    console.log('Token is being deployed...');
    const Token = await ethers.getContractFactory("Token");
    const token = await upgrades.deployProxy(Token, [tokenName, tokenSymbol, totSupply], { initializer: 'initialize' });
    await token.waitForDeployment();
    const tokenAddress = await token.getAddress();
    console.log("Proxy address:", tokenAddress);

    const implementationAddress = await upgrades.erc1967.getImplementationAddress(tokenAddress);
    const proxyAdminAddress = await upgrades.erc1967.getAdminAddress(tokenAddress);

    console.log("ProxyAdmin address:", proxyAdminAddress);
    console.log("Implementation address:", implementationAddress);

   
    // Save the token address to .env file for future upgrades
    fs.appendFileSync('.env', `\nPROXY_ADDRESS="${tokenAddress}"`);
  }
}



main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
const { ethers, upgrades } = require("hardhat");
const fs = require('fs');

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance));

  const IS_UPGRADE = process.env.IS_UPGRADE === 'true';
  const PROXY_ADDRESS = process.env.PROXY_ADDRESS || "";

  if (IS_UPGRADE) {
    console.log('Notarize is being upgraded...');
    console.log(`Notarize address for upgrade: ${PROXY_ADDRESS}`);

    if (!PROXY_ADDRESS || !ethers.isAddress(PROXY_ADDRESS)) {
      throw new Error(`Invalid proxy address: ${PROXY_ADDRESS}`);
    }

    try {
      const Notarize2 = await ethers.getContractFactory("Notarize2");
      const upgraded = await upgrades.upgradeProxy(PROXY_ADDRESS, Notarize2);
      await upgraded.waitForDeployment();
      const upgradedAddress = await upgraded.getAddress();
      console.log("Notarize upgraded to Notarize2 at:", upgradedAddress);
    } catch (error) {
      console.error("Error during upgrade:", error);
      throw error;
    }
  } else {
    console.log('Notarize is being deployed...');
    const Notarize = await ethers.getContractFactory("Notarize");
    const notarize = await upgrades.deployProxy(Notarize, [], { initializer: 'initialize' });
    await notarize.waitForDeployment();
    const notarizeAddress = await notarize.getAddress();
    console.log("Proxy address:", notarizeAddress);

    const implementationAddress = await upgrades.erc1967.getImplementationAddress(notarizeAddress);
    const proxyAdminAddress = await upgrades.erc1967.getAdminAddress(notarizeAddress);

    console.log("ProxyAdmin address:", proxyAdminAddress);
    console.log("Implementation address:", implementationAddress);

    // Save the notarize address to .env file for future upgrades
    fs.appendFileSync('.env', `\nPROXY_ADDRESS="${notarizeAddress}"`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
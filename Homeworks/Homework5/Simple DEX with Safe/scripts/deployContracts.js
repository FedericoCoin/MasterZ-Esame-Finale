const hre = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());

  // Deploy Token contract
  const Token = await ethers.getContractFactory("Token");
  const token = await Token.deploy("MyToken", "MTK", ethers.utils.parseUnits("10000000", 18));
  await token.deployed();
  console.log("Token contract deployed at:", token.address);

  // Deploy Safe contract
  const Safe = await ethers.getContractFactory("Safe");
  const safe = await Safe.deploy();
  await safe.deployed();
  console.log("Safe contract deployed at:", safe.address);

  // Deploy PriceConsumer contract
  const PriceConsumer = await ethers.getContractFactory("PriceConsumerV3");
  let priceConsumerAddress;

  if (hre.network.name === "hardhat" || hre.network.name === "localhost") {
    priceConsumerAddress = "0x0000000000000000000000000000000000000000"; // Use zero address for local testing
  } else if (hre.network.name === "goerli") {
    priceConsumerAddress = "0xD4a33860578De61DBAbDc8BFdb98FD742fA7028e"; // Goerli ETH/USD price feed
  } else if (hre.network.name === "sepolia") {
    priceConsumerAddress = "0x694AA1769357215DE4FAC081bf1f309aDC325306"; // Sepolia ETH/USD price feed
  } else {
    throw new Error("Unsupported network");
  }

  const priceConsumer = await PriceConsumer.deploy(priceConsumerAddress);
  await priceConsumer.deployed();
  console.log("PriceConsumer contract deployed at:", priceConsumer.address);


  try {
    const decimals = await priceConsumer.getPriceDecimals();
    console.log("Decimals from PriceConsumer:", decimals.toString());
  } catch (error) {
    console.error("Error fetching decimals:", error);
  }

  // Deploy SimpleDEX contract
  const SimpleDEX = await ethers.getContractFactory("SimpleDEX");
  const simpleDex = await SimpleDEX.deploy(token.address, priceConsumer.address, safe.address);
  await simpleDex.deployed();
  console.log("SimpleDEX contract deployed at:", simpleDex.address);

  // Transfer ownership of Safe to SimpleDEX
  await safe.transferOwnership(simpleDex.address);
  console.log("Ownership of Safe contract transferred to SimpleDEX");
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
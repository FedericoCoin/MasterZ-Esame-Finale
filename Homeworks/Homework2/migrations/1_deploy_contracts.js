const MultiTokenWallet = artifacts.require("MultiTokenWallet");
const MockV3Aggregator = artifacts.require("MockV3Aggregator");

const USE_MOCK_ORACLES = true;

module.exports = async function(deployer, network, accounts) {
  // Define initial values for mock price feeds
  const DECIMALS = 8;
  const INITIAL_ETH_USD_PRICE = 200000000000; // $2000.00000000
  const INITIAL_TOKEN_ETH_PRICE = 50000000000; // 0.50000000 ETH
  const INITIAL_EUR_USD_PRICE = 120000000000; // $1.20000000
  const INITIAL_BTC_ETH_PRICE = 1500000000000; // 15.00000000 ETH
  const INITIAL_BTC_USD_PRICE = 3000000000000; // $30000.00000000
  const INITIAL_GAS_PRICE = 2000000000; // 20 Gwei

  let ethUsdOracle, tokenEthOracle, eurUsdOracle, btcEthOracle, btcUsdOracle, gasOracle;

  if (USE_MOCK_ORACLES) {
    // Deploy MockV3Aggregator contracts
    await deployer.deploy(MockV3Aggregator, DECIMALS, INITIAL_ETH_USD_PRICE);
    ethUsdOracle = await MockV3Aggregator.deployed();

    await deployer.deploy(MockV3Aggregator, DECIMALS, INITIAL_TOKEN_ETH_PRICE);
    tokenEthOracle = await MockV3Aggregator.deployed();

    await deployer.deploy(MockV3Aggregator, DECIMALS, INITIAL_EUR_USD_PRICE);
    eurUsdOracle = await MockV3Aggregator.deployed();

    await deployer.deploy(MockV3Aggregator, DECIMALS, INITIAL_BTC_ETH_PRICE);
    btcEthOracle = await MockV3Aggregator.deployed();

    await deployer.deploy(MockV3Aggregator, DECIMALS, INITIAL_BTC_USD_PRICE);
    btcUsdOracle = await MockV3Aggregator.deployed();

    await deployer.deploy(MockV3Aggregator, DECIMALS, INITIAL_GAS_PRICE);
    gasOracle = await MockV3Aggregator.deployed();
  } else {
    // Use real oracle addresses (Sepolia testnet)
    ethUsdOracle = { address: "0x694AA1769357215DE4FAC081bf1f309aDC325306" };
    tokenEthOracle = { address: "0xAB894A477C31974D5B79BcE864F343455E1150" }; 
    eurUsdOracle = { address: "0x1a81afB8146aeFfCFc5E50e8479e826E7D55b910" };
    btcEthOracle = { address: "0x5fb1616F78dA7aFC9FF79e0371741a747D2a7F22" };
    btcUsdOracle = { address: "0x1b44F3514812d835EB1BDB0acB33d3fA3351Ee43" };
    gasOracle = { address: "0x169E633A2D1E6c10dD91238Ba11c4A708dfEF37C" };
  }

  // Deploy MultiTokenWallet
  await deployer.deploy(
    MultiTokenWallet,
    ethUsdOracle.address,
    tokenEthOracle.address,
    eurUsdOracle.address,
    btcEthOracle.address,
    btcUsdOracle.address,
    gasOracle.address
  );

  const multiTokenWallet = await MultiTokenWallet.deployed();

  console.log("MultiTokenWallet deployed at:", multiTokenWallet.address);
  console.log("ETH/USD Oracle deployed at:", ethUsdOracle.address);
  console.log("TOKEN/ETH Oracle deployed at:", tokenEthOracle.address);
  console.log("EUR/USD Oracle deployed at:", eurUsdOracle.address);
  console.log("BTC/ETH Oracle deployed at:", btcEthOracle.address);
  console.log("BTC/USD Oracle deployed at:", btcUsdOracle.address);
  console.log("Gas Price Oracle deployed at:", gasOracle.address);
};
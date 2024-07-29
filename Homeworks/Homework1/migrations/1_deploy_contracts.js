const Token = artifacts.require("Token");

module.exports = async function(deployer, network, accounts) {
  const tokenName = "My Custom Token";
  const tokenSymbol = "MCT";

  // Deploy the Token contract
  await deployer.deploy(Token, tokenName, tokenSymbol);
  const tokenInstance = await Token.deployed();

  console.log(`Token deployed at address: ${tokenInstance.address}`);

  // Mint some initial tokens to the deployer's account
  const initialSupply = web3.utils.toWei('1000000', 'ether'); // 1 million tokens
  await tokenInstance.mint(accounts[0], initialSupply);

  console.log(`Minted ${web3.utils.fromWei(initialSupply, 'ether')} tokens to ${accounts[0]}`);

};
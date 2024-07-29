const { expect, assert } = require("chai");
const { ethers } = require("hardhat");

describe("SimpleDEX and Safe", function () {
  let token, safe, priceConsumer, simpleDex;
  let owner, addr1, addr2;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();

    // Deploy Token contract
    const Token = await ethers.getContractFactory("Token");
    token = await Token.deploy("MyToken", "MTK", ethers.utils.parseUnits("1000000", 18));
    await token.deployed();

    // Deploy Safe contract
    const Safe = await ethers.getContractFactory("Safe");
    safe = await Safe.deploy();
    await safe.deployed();


    // Deploy PriceConsumer contract with zero address for local testing
    const PriceConsumer = await ethers.getContractFactory("PriceConsumerV3");
    priceConsumer = await PriceConsumer.deploy(ethers.constants.AddressZero);
    await priceConsumer.deployed();


    // Deploy SimpleDEX contract
    const SimpleDEX = await ethers.getContractFactory("SimpleDEX");
  simpleDex = await SimpleDEX.deploy(token.address, priceConsumer.address, safe.address);
  await simpleDex.deployed();
  console.log("SimpleDEX deployed at:", simpleDex.address);

  // Transfer ownership of Safe to SimpleDEX
  await safe.transferOwnership(simpleDex.address);
  console.log("Safe ownership transferred to SimpleDEX");

  // Verify ownership transfer
  const newOwner = await safe.owner();
  console.log("New Safe owner:", newOwner);
  if (newOwner !== simpleDex.address) {
    throw new Error(`Ownership transfer failed. Expected ${simpleDex.address}, got ${newOwner}`);
  }
});

  describe("Token contract", function () {
    it("mint tokens correctly", async function () {
      const ownerBalance = await token.balanceOf(owner.address);
      console.log("Owner token balance:", ethers.utils.formatUnits(ownerBalance, 18));
      assert.equal(ownerBalance.toString(), ethers.utils.parseUnits("1000000", 18).toString(), "Owner balance should be 1,000,000 tokens");
    });

    it("Transfer tokens correctly", async function () {
      await token.transfer(addr1.address, ethers.utils.parseUnits("100", 18));
      const addr1Balance = await token.balanceOf(addr1.address);
      expect(addr1Balance).to.equal(ethers.utils.parseUnits("100", 18));
      console.log("Address 1 token balance after transfer:", ethers.utils.formatUnits(addr1Balance, 18));
    });
  });

  describe("PriceConsumer contract", function () {
    it("fetch the latest price", async function () {
      const latestPrice = await priceConsumer.getLatestPrice();
      expect(latestPrice).to.equal(200000000000);
      console.log("Latest ETH/USD price:", ethers.utils.formatUnits(latestPrice, 8));
    });

    it("Return correct decimals", async function () {
      const decimals = await priceConsumer.getPriceDecimals();
      console.log("Price feed decimals:", decimals.toString());
      assert.equal(decimals, 8, "Decimals should be 8");
    });
  });

  describe("Safe contract", function () {
    it("deposit and withdraw Ether", async function () {
      await owner.sendTransaction({ to: safe.address, value: ethers.utils.parseEther("1") });
      const safeBalance = await ethers.provider.getBalance(safe.address);
      expect(safeBalance).to.equal(ethers.utils.parseEther("1"));
      console.log("Safe ETH balance:", ethers.utils.formatEther(safeBalance));

      await simpleDex.emergencyTransfer(ethers.constants.AddressZero, ethers.utils.parseEther("1"), addr1.address);
      const addr1Balance = await ethers.provider.getBalance(addr1.address);
      expect(addr1Balance).to.be.gt(ethers.utils.parseEther("10000"));
      console.log("Address 1 ETH balance after withdrawal:", ethers.utils.formatEther(addr1Balance));
    });

    it("Deposit and withdraw tokens", async function () {
      await token.transfer(safe.address, ethers.utils.parseUnits("100", 18));
      const safeTokenBalance = await token.balanceOf(safe.address);
      expect(safeTokenBalance).to.equal(ethers.utils.parseUnits("100", 18));
      console.log("Safe token balance:", ethers.utils.formatUnits(safeTokenBalance, 18));

      await simpleDex.emergencyTransfer(token.address, ethers.utils.parseUnits("100", 18), addr1.address);
      const addr1TokenBalance = await token.balanceOf(addr1.address);
      expect(addr1TokenBalance).to.equal(ethers.utils.parseUnits("100", 18));
      console.log("Address 1 token balance after withdrawal:", ethers.utils.formatUnits(addr1TokenBalance, 18));
    });
  });

  describe("SimpleDEX contract", function () {
    it("allow buying tokens with Ether", async function () {
      
      const tokenAmount = ethers.utils.parseUnits("10000", 18); 
      await token.transfer(safe.address, tokenAmount);
      
      // Verify the Safe received the tokens
      const safeBalance = await token.balanceOf(safe.address);
      console.log("Safe token balance after transfer:", ethers.utils.formatUnits(safeBalance, 18));
      expect(safeBalance).to.equal(tokenAmount);
    
      // Get initial balances
      const initialSafeBalance = await token.balanceOf(safe.address);
      const initialAddr1Balance = await token.balanceOf(addr1.address);
      
      // Calculate expected token amount based on ETH price
      const ethAmount = ethers.utils.parseEther("1");
      const ethPrice = await priceConsumer.getLatestPrice();
      const expectedTokenAmount = ethAmount.mul(ethPrice).div(ethers.utils.parseUnits("1", 8)); // 8 decimals for price
    
      console.log("Expected token amount:", ethers.utils.formatUnits(expectedTokenAmount, 18));
    
      // Perform the buy operation
      await simpleDex.connect(addr1).buyToken({ value: ethAmount });
    
      // Get final balances
      const finalSafeBalance = await token.balanceOf(safe.address);
      const finalAddr1Balance = await token.balanceOf(addr1.address);
      
      console.log("Final Safe balance:", ethers.utils.formatUnits(finalSafeBalance, 18));
      console.log("Final Address 1 balance:", ethers.utils.formatUnits(finalAddr1Balance, 18));
    
      // Check that tokens were transferred
      expect(finalSafeBalance).to.be.lt(initialSafeBalance);
      expect(finalAddr1Balance).to.be.gt(initialAddr1Balance);
      expect(finalAddr1Balance).to.equal(expectedTokenAmount);
      console.log("Address 1 token balance after buying:", ethers.utils.formatUnits(finalAddr1Balance, 18));
    });

    it("Handle emergency transfers", async function () {
      await token.transfer(safe.address, ethers.utils.parseUnits("10", 18));
      await simpleDex.emergencyTransfer(token.address, ethers.utils.parseUnits("10", 18), addr2.address);

      const addr2TokenBalance = await token.balanceOf(addr2.address);
      expect(addr2TokenBalance).to.equal(ethers.utils.parseUnits("10", 18));
      console.log("Address 2 token balance after emergency transfer:", ethers.utils.formatUnits(addr2TokenBalance, 18));
    });
  });
});

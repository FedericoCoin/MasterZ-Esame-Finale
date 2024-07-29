const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("DEX", function () {
  let DEX, dex, CryptoDevToken, cryptoDevToken, owner, addr1, addr2;
  const INITIAL_SUPPLY = ethers.utils.parseEther("1000000");

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();

    CryptoDevToken = await ethers.getContractFactory("CryptoDevToken");
    cryptoDevToken = await CryptoDevToken.deploy();
    await cryptoDevToken.deployed();

    DEX = await ethers.getContractFactory("DEX");
    dex = await DEX.deploy(cryptoDevToken.address);
    await dex.deployed();

    // Approve DEX to spend tokens
    await cryptoDevToken.approve(dex.address, INITIAL_SUPPLY);
    await cryptoDevToken.connect(addr1).approve(dex.address, INITIAL_SUPPLY);
    await cryptoDevToken.connect(addr2).approve(dex.address, INITIAL_SUPPLY);

    // Transfer some tokens to addr1 and addr2 for testing
    await cryptoDevToken.transfer(addr1.address, ethers.utils.parseEther("100000"));
    await cryptoDevToken.transfer(addr2.address, ethers.utils.parseEther("100000"));
  });

  describe("Deployment", function () {
    it("Should set the right token address", async function () {
      expect(await dex.cryptoDevTokenAddress()).to.equal(cryptoDevToken.address);
    });

    it("Should have the correct name and symbol for LP tokens", async function () {
      expect(await dex.name()).to.equal("CryptoDev LP Token");
      expect(await dex.symbol()).to.equal("CDLP");
    });
  });

  describe("Liquidity", function () {
    it("Add initial liquidity", async function () {
      const ethAmount = ethers.utils.parseEther("10");
      const tokenAmount = ethers.utils.parseEther("5000");

      await expect(dex.addLiquidity(tokenAmount, { value: ethAmount }))
        .to.emit(dex, "LiquidityAdded")
        .withArgs(owner.address, ethAmount, tokenAmount, ethAmount.sub(1000)); // 1000 wei less due to MINIMUM_LIQUIDITY

      expect(await dex.getReserve()).to.equal(tokenAmount);
      expect(await dex.balanceOf(owner.address)).to.equal(ethAmount.sub(1000));
    });

    it("Add more liquidity proportionally", async function () {
        await dex.addLiquidity(ethers.utils.parseEther("5000"), { value: ethers.utils.parseEther("10") });
        
        const ethAmount = ethers.utils.parseEther("1");
      
        // Get the current reserves
        const tokenReserve = await dex.getReserve();
        const ethReserve = await ethers.provider.getBalance(dex.address);
      
        // Calculate the required token amount
        const requiredTokenAmount = ethAmount.mul(tokenReserve).div(ethReserve);
      
        // Add a small buffer to ensure we're over the minimum required amount
        const tokenAmountWithBuffer = requiredTokenAmount.mul(1001).div(1000);
      
        // Get initial balances
        const initialLpBalance = await dex.balanceOf(addr1.address);
        const initialTokenBalance = await cryptoDevToken.balanceOf(addr1.address);
      
        // Perform the addLiquidity transaction
        await expect(dex.connect(addr1).addLiquidity(tokenAmountWithBuffer, { value: ethAmount }))
          .to.emit(dex, "LiquidityAdded");
      
        // Check the changes in balances
        const finalLpBalance = await dex.balanceOf(addr1.address);
        const finalTokenBalance = await cryptoDevToken.balanceOf(addr1.address);
      
        // Verify LP tokens were minted
        expect(finalLpBalance.sub(initialLpBalance)).to.be.gt(0);
      
        // Verify tokens were transferred
        const tokensDifference = initialTokenBalance.sub(finalTokenBalance);
        expect(tokensDifference).to.be.gte(requiredTokenAmount);
        expect(tokensDifference).to.be.lte(tokenAmountWithBuffer);
      });

    it("Remove liquidity", async function () {
  const initialEthAmount = ethers.utils.parseEther("10");
  const initialTokenAmount = ethers.utils.parseEther("5000");
  await dex.addLiquidity(initialTokenAmount, { value: initialEthAmount });
  
  const lpTokens = await dex.balanceOf(owner.address);

  // Calculate expected amounts considering MINIMUM_LIQUIDITY
  const totalSupply = await dex.totalSupply();
  const expectedEthAmount = initialEthAmount.mul(lpTokens).div(totalSupply);
  const expectedTokenAmount = initialTokenAmount.mul(lpTokens).div(totalSupply);

  await expect(dex.removeLiquidity(lpTokens))
    .to.emit(dex, "LiquidityRemoved")
    .withArgs(owner.address, expectedEthAmount, expectedTokenAmount, lpTokens);
});
  });

  describe("Swapping", function () {
    beforeEach(async function () {
      await dex.addLiquidity(ethers.utils.parseEther("5000"), { value: ethers.utils.parseEther("10") });
    });

    it("Swap ETH for tokens", async function () {
      const ethAmount = ethers.utils.parseEther("1");
      const expectedTokenOutput = await dex.getOutputAmount(ethAmount, ethers.utils.parseEther("10"), ethers.utils.parseEther("5000"));

      await expect(dex.connect(addr1).swapEthForTokens(0, { value: ethAmount }))
        .to.emit(dex, "TokenSwap")
        .withArgs(addr1.address, ethAmount, expectedTokenOutput, true);
    });

    it("Swap tokens for ETH", async function () {
      const tokenAmount = ethers.utils.parseEther("100");
      const expectedEthOutput = await dex.getOutputAmount(tokenAmount, ethers.utils.parseEther("5000"), ethers.utils.parseEther("10"));

      await expect(dex.connect(addr1).swapTokensForEth(tokenAmount, 0))
        .to.emit(dex, "TokenSwap")
        .withArgs(addr1.address, tokenAmount, expectedEthOutput, false);
    });

    it("Should fail when output amount is less than minimum expected", async function () {
      const ethAmount = ethers.utils.parseEther("1");
      const minTokens = ethers.utils.parseEther("1000"); // Unrealistically high expectation

      await expect(dex.connect(addr1).swapEthForTokens(minTokens, { value: ethAmount }))
        .to.be.revertedWith("Insufficient output amount");
    });
  });

  describe("Price Calculation", function () {
    beforeEach(async function () {
      await dex.addLiquidity(ethers.utils.parseEther("5000"), { value: ethers.utils.parseEther("10") });
    });

    it("Calculate correct token price in ETH", async function () {
      const tokenAmount = ethers.utils.parseEther("100");
      const expectedEthPrice = ethers.utils.parseEther("0.2"); // 100 tokens = 0.2 ETH
      expect(await dex.getTokenPrice(tokenAmount)).to.equal(expectedEthPrice);
    });

    it("Calculate correct ETH price in tokens", async function () {
      const ethAmount = ethers.utils.parseEther("1");
      const expectedTokenPrice = ethers.utils.parseEther("500"); // 1 ETH = 500 tokens
      expect(await dex.getEthPrice(ethAmount)).to.equal(expectedTokenPrice);
    });
  });

  describe("Edge cases and error handling", function () {
    it("Should fail when adding liquidity with insufficient token approval", async function () {
      await cryptoDevToken.connect(addr1).approve(dex.address, 0); // Reset approval
      await expect(dex.connect(addr1).addLiquidity(ethers.utils.parseEther("1000"), { value: ethers.utils.parseEther("2") }))
        .to.be.reverted;
    });

    it("Should fail when removing more liquidity than owned", async function () {
      await dex.addLiquidity(ethers.utils.parseEther("5000"), { value: ethers.utils.parseEther("10") });
      const lpTokens = await dex.balanceOf(owner.address);
      await expect(dex.removeLiquidity(lpTokens.add(1))).to.be.revertedWith("ERC20: burn amount exceeds balance");
    });

    it("Handle zero liquidity edge case", async function () {
      const ethAmount = ethers.utils.parseEther("1");
      const tokenAmount = ethers.utils.parseEther("500");
      await expect(dex.addLiquidity(tokenAmount, { value: ethAmount }))
        .to.emit(dex, "LiquidityAdded")
        .withArgs(owner.address, ethAmount, tokenAmount, ethAmount.sub(1000));
    });
  });
});
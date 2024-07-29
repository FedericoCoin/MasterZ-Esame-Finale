const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("MyNFTTokenFactory", function () {
  let MyNFTTokenFactory, factory, MyNFTToken, owner, creator, other;
  const name1 = "Test NFT #1";
  const symbol1 = "TEST1";
  const name2 = "Test NFT #2";
  const symbol2 = "TEST2";

  beforeEach(async function () {
    [owner, creator, other] = await ethers.getSigners();
    MyNFTTokenFactory = await ethers.getContractFactory("MyNFTTokenFactory");
    MyNFTToken = await ethers.getContractFactory("MyNFTToken");
    factory = await MyNFTTokenFactory.deploy();
    await factory.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Set the right owner", async function () {
      expect(await factory.owner()).to.equal(owner.address);
    });

    it("Start with zero deployed tokens", async function () {
      expect(await factory.getNFTTokenCount()).to.equal(0);
    });
  });

  describe("NFT Token Deployment", function () {
    it("Deploy a new NFT token", async function () {
      await expect(factory.deployNewNFTToken(name1, symbol1, creator.address))
        .to.emit(factory, "NFTTokenDeployed")
        .withArgs(
          (address) => ethers.isAddress(address),
          name1,
          symbol1,
          creator.address
        );

      expect(await factory.getNFTTokenCount()).to.equal(1);
    });

    it("Should not allow non-owners to deploy tokens", async function () {
      await expect(factory.connect(other).deployNewNFTToken(name1, symbol1, creator.address))
        .to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Track correctly multiple deployed tokens", async function () {
      await factory.deployNewNFTToken(name1, symbol1, creator.address);
      await factory.deployNewNFTToken(name2, symbol2, creator.address);

      expect(await factory.getNFTTokenCount()).to.equal(2);
      expect(await factory.isNFTTokenDeployed(await factory.getNFTTokenAddress(0))).to.be.true;
      expect(await factory.isNFTTokenDeployed(await factory.getNFTTokenAddress(1))).to.be.true;
    });
  });

  describe("NFT Token Management", function () {
    let nftAddress;
  
    beforeEach(async function () {
      await factory.deployNewNFTToken(name1, symbol1, creator.address);
      nftAddress = await factory.getNFTTokenAddress(0);  // Get the address of the first deployed token
    });
  
    it("Identify correctly deployed tokens", async function () {
      expect(await factory.isNFTTokenDeployed(nftAddress)).to.be.true;
      expect(await factory.isNFTTokenDeployed(other.address)).to.be.false;
    });
  
    it("Allow pausing of deployed tokens", async function () {
      await expect(factory.pauseNFTContract(nftAddress))
        .to.emit(factory, "NFTTokenPaused")
        .withArgs(nftAddress);
  
      const nftContract = await ethers.getContractAt("MyNFTToken", nftAddress);
      expect(await nftContract.paused()).to.be.true;
    });
  
    it("Allow unpausing of deployed tokens", async function () {
      await factory.pauseNFTContract(nftAddress);
      await expect(factory.unpauseNFTContract(nftAddress))
        .to.emit(factory, "NFTTokenUnpaused")
        .withArgs(nftAddress);
  
      const nftContract = await ethers.getContractAt("MyNFTToken", nftAddress);
      expect(await nftContract.paused()).to.be.false;
    });
  
    it("Should not allow pausing/unpausing of non-deployed tokens", async function () {
      await expect(factory.pauseNFTContract(other.address))
        .to.be.revertedWithCustomError(factory, "TokenNotDeployedByFactory")
        .withArgs(other.address);
  
      await expect(factory.unpauseNFTContract(other.address))
        .to.be.revertedWithCustomError(factory, "TokenNotDeployedByFactory")
        .withArgs(other.address);
    });
  
    it("Should not allow non-owners to pause/unpause tokens", async function () {
      await expect(factory.connect(other).pauseNFTContract(nftAddress))
        .to.be.revertedWith("Ownable: caller is not the owner");
  
      await expect(factory.connect(other).unpauseNFTContract(nftAddress))
        .to.be.revertedWith("Ownable: caller is not the owner");
    });
  });
});
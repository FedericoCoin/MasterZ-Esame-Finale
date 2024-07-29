const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ERC20TokenFactory", function () {
  let ERC20TokenFactory, factory, ERC20Token, owner, user1, user2;
  const name = "Test Token";
  const symbol = "TEST";
  const initialSupply = ethers.parseEther("1000000");

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();
    
    ERC20TokenFactory = await ethers.getContractFactory("ERC20TokenFactory");
    factory = await ERC20TokenFactory.deploy();
    
    await factory.waitForDeployment();

    ERC20Token = await ethers.getContractFactory("ERC20Token");
  });

  describe("Deployment", function () {
    it("Set the right owner", async function () {
      expect(await factory.owner()).to.equal(owner.address);
    });

    it("Start with zero deployed tokens", async function () {
      expect(await factory.getDeployedTokensCount()).to.equal(0);
    });
  });

  describe("Token Deployment", function () {
    it("Deploy a new token", async function () {
      await expect(factory.deployToken(name, symbol, initialSupply, user1.address))
        .to.emit(factory, "TokenDeployed")
        .withArgs(
          (tokenAddress) => ethers.isAddress(tokenAddress),
          name,
          symbol,
          initialSupply,
          user1.address
        );
    
      expect(await factory.getDeployedTokensCount()).to.equal(1);
    });

    it("Should not allow non-owners to deploy tokens", async function () {
      await expect(factory.connect(user1).deployToken(name, symbol, initialSupply, user1.address))
        .to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Track correctly multiple deployed tokens", async function () {
      await factory.deployToken(name, symbol, initialSupply, user1.address);
      await factory.deployToken("Test Token 2", "TEST2", initialSupply, user2.address);

      expect(await factory.getDeployedTokensCount()).to.equal(2);
      const deployedTokens = await factory.getDeployedTokens();
      expect(deployedTokens.length).to.equal(2);
      expect(await factory.isTokenDeployed(deployedTokens[0])).to.be.true;
      expect(await factory.isTokenDeployed(deployedTokens[1])).to.be.true;
    });
  });

  describe("Deployed Token Functionality", function () {
    let tokenAddress;
    let token;
  
    beforeEach(async function () {
      const tx = await factory.deployToken(name, symbol, initialSupply, user1.address);
      const receipt = await tx.wait();
      
      const filter = factory.filters.TokenDeployed();
      const events = await factory.queryFilter(filter, receipt.blockNumber, receipt.blockNumber);
      
      if (events.length === 0) {
        throw new Error("TokenDeployed event not found");
      }
      
      tokenAddress = events[0].args[0];
      
      token = await ethers.getContractAt("ERC20Token", tokenAddress);
    });
  
    it("Initialize the token correctly", async function () {
      expect(await token.name()).to.equal(name);
      expect(await token.symbol()).to.equal(symbol);
      expect(await token.totalSupply()).to.equal(initialSupply);
      expect(await token.balanceOf(user1.address)).to.equal(initialSupply);
    });

    it("Set correct roles", async function () {
      const DEFAULT_ADMIN_ROLE = await token.DEFAULT_ADMIN_ROLE();
      const MINTER_ROLE = await token.MINTER_ROLE();
      const PAUSER_ROLE = await token.PAUSER_ROLE();

      expect(await token.hasRole(DEFAULT_ADMIN_ROLE, user1.address)).to.be.true;
      expect(await token.hasRole(MINTER_ROLE, user1.address)).to.be.true;
      expect(await token.hasRole(PAUSER_ROLE, user1.address)).to.be.true;
    });

    it("Allow minting by minter", async function () {
      await token.connect(user1).mint(user2.address, 1000);
      expect(await token.balanceOf(user2.address)).to.equal(1000);
    });

    it("Allow pausing by pauser", async function () {
      await token.connect(user1).pause();
      expect(await token.paused()).to.be.true;
    });

    it("Allow blacklisting by admin", async function () {
      await token.connect(user1).blacklist(user2.address);
      expect(await token.isBlacklisted(user2.address)).to.be.true;
    });
  });
});
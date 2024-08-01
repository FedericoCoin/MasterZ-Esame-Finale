const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");

describe("MythoriaToken", function () {
  let MythoriaToken, mythoriaToken, owner, addr1, addr2, addrs;

  beforeEach(async function () {
    [owner, addr1, addr2, ...addrs] = await ethers.getSigners();

    MythoriaToken = await ethers.getContractFactory("MythoriaToken");
    mythoriaToken = await upgrades.deployProxy(MythoriaToken, [owner.address], {
      initializer: "initialize",
    });
  });

  describe("Deployment", function () {
    it("Set the right owner", async function () {
      expect(await mythoriaToken.owner()).to.equal(owner.address);
    });

    it("Assign the total supply of tokens to the owner", async function () {
      const ownerBalance = await mythoriaToken.balanceOf(owner.address);
      expect(await mythoriaToken.totalSupply()).to.equal(ownerBalance);
    });

    it("Set the max supply correctly", async function () {
      const maxSupply = ethers.parseUnits("10000000000", 18); // 10 billion tokens with 18 decimals
      expect(await mythoriaToken.cap()).to.equal(maxSupply);
    });
  });

  describe("Transactions", function () {
    it("Transfer tokens between accounts", async function () {
      await mythoriaToken.transfer(addr1.address, 50);
      const addr1Balance = await mythoriaToken.balanceOf(addr1.address);
      expect(addr1Balance).to.equal(50);

      await mythoriaToken.connect(addr1).transfer(addr2.address, 50);
      const addr2Balance = await mythoriaToken.balanceOf(addr2.address);
      expect(addr2Balance).to.equal(50);
    });

    it("Should fail if sender doesn't have enough tokens", async function () {
      const initialOwnerBalance = await mythoriaToken.balanceOf(owner.address);
      await expect(
        mythoriaToken.connect(addr1).transfer(owner.address, 1)
      ).to.be.revertedWith("ERC20: transfer amount exceeds balance");
      expect(await mythoriaToken.balanceOf(owner.address)).to.equal(
        initialOwnerBalance
      );
    });

    it("Update balances after transfers", async function () {
      const initialOwnerBalance = await mythoriaToken.balanceOf(owner.address);
      await mythoriaToken.transfer(addr1.address, 100);
      await mythoriaToken.transfer(addr2.address, 50);

      const finalOwnerBalance = await mythoriaToken.balanceOf(owner.address);
      expect(finalOwnerBalance).to.equal(initialOwnerBalance - BigInt(150));

      const addr1Balance = await mythoriaToken.balanceOf(addr1.address);
      expect(addr1Balance).to.equal(BigInt(100));

      const addr2Balance = await mythoriaToken.balanceOf(addr2.address);
      expect(addr2Balance).to.equal(BigInt(50));
    });
  });

  describe("Minting", function () {
    it("Should only allow owner to mint tokens", async function () {
      await mythoriaToken.mint(addr1.address, 100);
      expect(await mythoriaToken.balanceOf(addr1.address)).to.equal(100);

      await expect(
        mythoriaToken.connect(addr1).mint(addr2.address, 100)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Don't allow minting beyond max supply", async function () {
      const maxSupply = await mythoriaToken.cap();
      const currentSupply = await mythoriaToken.totalSupply();
      const mintAmount = maxSupply - currentSupply + BigInt(1);

      await expect(
        mythoriaToken.mint(addr1.address, mintAmount)
      ).to.be.revertedWith("ERC20Capped: cap exceeded");
    });
  });

  describe("Burning", function () {
    it("Allow users to burn their own tokens", async function () {
      await mythoriaToken.transfer(addr1.address, 100);
      await mythoriaToken.connect(addr1).burn(50);
      expect(await mythoriaToken.balanceOf(addr1.address)).to.equal(50);
    });
  });

  describe("Pausing", function () {
    it("Allow owner to pause and unpause", async function () {
      await mythoriaToken.pause();
      expect(await mythoriaToken.paused()).to.equal(true);

      await expect(
        mythoriaToken.transfer(addr1.address, 100)
      ).to.be.revertedWith("Pausable: paused");

      await mythoriaToken.unpause();
      expect(await mythoriaToken.paused()).to.equal(false);

      await mythoriaToken.transfer(addr1.address, 100);
      expect(await mythoriaToken.balanceOf(addr1.address)).to.equal(100);
    });

    it("Don't allow non-owner to pause", async function () {
      await expect(mythoriaToken.connect(addr1).pause()).to.be.revertedWith(
        "Ownable: caller is not the owner"
      );
    });
  });

  describe("Blacklisting", function () {
    it("Allow owner to blacklist and unblacklist addresses", async function () {
      await mythoriaToken.blacklist(addr1.address);
      expect(await mythoriaToken.isBlacklisted(addr1.address)).to.equal(true);

      await expect(
        mythoriaToken.transfer(addr1.address, 100)
      ).to.be.revertedWith("Blacklisted address");

      await mythoriaToken.unblacklist(addr1.address);
      expect(await mythoriaToken.isBlacklisted(addr1.address)).to.equal(false);

      await mythoriaToken.transfer(addr1.address, 100);
      expect(await mythoriaToken.balanceOf(addr1.address)).to.equal(100);
    });

    it("Don't allow non-owner to blacklist", async function () {
      await expect(
        mythoriaToken.connect(addr1).blacklist(addr2.address)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });
});
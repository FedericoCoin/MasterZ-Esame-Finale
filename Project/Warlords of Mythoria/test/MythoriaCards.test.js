const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("MythoriaCards", function () {
  let MythoriaCards;
  let mythoriaCards;
  let owner;
  let addr1;
  let addr2;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();

    MythoriaCards = await ethers.getContractFactory("MythoriaCards");
    mythoriaCards = await MythoriaCards.deploy();
    await mythoriaCards.initialize("https://example.com/");
  });

  describe("Initialization", function () {
    it("Set the right owner", async function () {
      expect(await mythoriaCards.owner()).to.equal(owner.address);
    });

    it("Set the correct base URI", async function () {
      expect(await mythoriaCards.uri(1)).to.equal("https://example.com/1.json");
    });
  });

  describe("URI Management", function () {
    it("Should allow owner to set base URI", async function () {
      await mythoriaCards.setBaseURI("https://newexample.com/");
      expect(await mythoriaCards.uri(1)).to.equal("https://newexample.com/1.json");
    });

    it("Allow owner to set token URI", async function () {
      await mythoriaCards.setTokenUri(1, "https://customuri.com/1");
      expect(await mythoriaCards.uri(1)).to.equal("https://customuri.com/1");
    });

    it("Should not allow setting token URI twice", async function () {
      await mythoriaCards.setTokenUri(1, "https://customuri.com/1");
      await expect(mythoriaCards.setTokenUri(1, "https://customuri.com/1")).to.be.revertedWith("Cannot set uri twice");
    });
  });

  describe("Minting", function () {
    it("Should allow owner to mint tokens", async function () {
      await mythoriaCards.mint(addr1.address, 1, 100, "0x");
      expect(await mythoriaCards.balanceOf(addr1.address, 1)).to.equal(100);
    });

    it("Allow owner to batch mint tokens", async function () {
      await mythoriaCards.mintBatch(addr1.address, [1, 2], [100, 200], "0x");
      expect(await mythoriaCards.balanceOf(addr1.address, 1)).to.equal(100);
      expect(await mythoriaCards.balanceOf(addr1.address, 2)).to.equal(200);
    });
  });

  describe("Card Transfer", function () {
    beforeEach(async function () {
      await mythoriaCards.mint(owner.address, 1, 100, "0x");
    });

    it("Allow transfer of cards", async function () {
      // Check initial balance
      const initialBalance = await mythoriaCards.balanceOf(owner.address, 1);
      console.log("Initial balance:", initialBalance.toString());

      // Transfer half of the balance
      const transferAmount = initialBalance / 2n;
      await mythoriaCards.transferCard(owner.address, addr1.address, 1, transferAmount);

      // Check balances after transfer
      const ownerBalance = await mythoriaCards.balanceOf(owner.address, 1);
      const addr1Balance = await mythoriaCards.balanceOf(addr1.address, 1);

      expect(ownerBalance).to.equal(initialBalance - transferAmount);
      expect(addr1Balance).to.equal(transferAmount);
    });

    it("Emit CardTransferred event", async function () {
      await expect(mythoriaCards.transferCard(owner.address, addr1.address, 1, 50))
        .to.emit(mythoriaCards, "CardTransferred")
        .withArgs(owner.address, addr1.address, 1, 50);
    });

    it("Revert if sender has insufficient balance", async function () {
      // Check initial balance
      const initialBalance = await mythoriaCards.balanceOf(owner.address, 1);
      console.log("Initial balance:", initialBalance.toString());

      // Try to transfer more than the available balance
      await expect(mythoriaCards.transferCard(owner.address, addr1.address, 1, initialBalance + 1n))
        .to.be.revertedWith("Insufficient balance");
    });
  });

  describe("Card Metadata", function () {
    it("Allow owner to update card metadata", async function () {
      const newMetadata = {
        name: "New Card",
        cardType: "Creature",
        rarity: 0, 
        attack: 10,
        defense: 10,
        hp: 100,
        speed: 5,
        deploymentCost: 1,
        attackCost: 1,
        evolutionStage: "Basic",
        nextEvolution: "",
        evolveFrom: "",
        canEvolve: false,
        isEvolved: false,
        speedBoost: 0,
        attackBoost: 0,
        defenceBoost: 0,
        hpBoost: 0,
        damage: 0,
        hpRecovery: 0,
        opponentAttackDecrease: 0,
        opponentSpeedDecrease: 0,
        opponentDefenceDecrease: 0,
        canTrade: true,
        isAttachable: false,
        manaGain: 0,
        commonCardsContained: 0,
        rareCardsContained: 0,
        epicCardsContained: 0,
        legendaryCardsContained: 0
      };

      await mythoriaCards.updateCardMetadata(1, newMetadata);
      const updatedMetadata = await mythoriaCards.getCardAttributes(1);
      expect(updatedMetadata.name).to.equal("New Card");
    });

    it("Return card attributes", async function () {
      const attributes = await mythoriaCards.getCardAttributes(1);
      expect(attributes.name).to.be.a('string');
    });
  });

  describe("Utility Functions", function () {
    it("Should return cards by rarity", async function () {
      const commonCards = await mythoriaCards.getCardsByRarity(0); // Common
      expect(commonCards).to.be.an('array');
      // You might want to add more specific checks here, depending on your initial card setup
    });

    it("Revert when getting attributes for an invalid card ID", async function () {
      await expect(mythoriaCards.getCardAttributes(0)).to.be.revertedWith("Invalid card ID");
      await expect(mythoriaCards.getCardAttributes(62)).to.be.revertedWith("Invalid card ID");
    });
  });

  describe("Initial Supply", function () {
    it("Mint initial supply correctly", async function () {
      expect(await mythoriaCards.balanceOf(owner.address, 58)).to.equal(5000); // Common Pack
      expect(await mythoriaCards.balanceOf(owner.address, 59)).to.equal(300);  // Rare Pack
      expect(await mythoriaCards.balanceOf(owner.address, 60)).to.equal(40);   // Epic Pack
      expect(await mythoriaCards.balanceOf(owner.address, 61)).to.equal(3);    // Legendary Pack
    });
  });
});
const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");

describe("DeckContract", function () {
  let DeckContract, MythoriaCards, MythoriaToken;
  let deckContract, mythoriaCards, mythoriaToken;
  let owner, player1, player2;

  beforeEach(async function () {
    [owner, player1, player2] = await ethers.getSigners();

    // Deploy MythoriaCards
    MythoriaCards = await ethers.getContractFactory("MythoriaCards");
    mythoriaCards = await upgrades.deployProxy(MythoriaCards, ["https://example.com/"]);

    // Deploy MythoriaToken
    MythoriaToken = await ethers.getContractFactory("MythoriaToken");
    mythoriaToken = await upgrades.deployProxy(MythoriaToken, [owner.address]);

    // Deploy DeckContract
    DeckContract = await ethers.getContractFactory("DeckContract");
    deckContract = await upgrades.deployProxy(DeckContract, [await mythoriaCards.getAddress(), await mythoriaToken.getAddress()]);

    // Mint initial cards to the DeckContract
    for (let i = 1; i <= 61; i++) {
      await mythoriaCards.mint(await deckContract.getAddress(), i, 10000, "0x");
    }

    // Mint initial tokens to the DeckContract
    await mythoriaToken.mint(await deckContract.getAddress(), ethers.parseEther("10000"));

    // Approve DeckContract to transfer tokens on behalf of the owner
    await mythoriaCards.setApprovalForAll(await deckContract.getAddress(), true);
  });

  it("Set the correct MythoriaCards and MythoriaToken addresses", async function () {
    expect(await deckContract.mythoriaCards()).to.equal(await mythoriaCards.getAddress());
    expect(await deckContract.mythoriaToken()).to.equal(await mythoriaToken.getAddress());
  });

  describe("Initialization", function () {
    it("Set the correct MythoriaCards and MythoriaToken addresses", async function () {
      expect(await deckContract.mythoriaCards()).to.equal(await mythoriaCards.getAddress());
      expect(await deckContract.mythoriaToken()).to.equal(await mythoriaToken.getAddress());
    });
  });

  describe("Player Registration", function () {
    it("Register a new player", async function () {
      await deckContract.connect(player1).register("Player One");
      const player = await deckContract.players(player1.address);
      expect(player.name).to.equal("Player One");
    });

    it("Should not allow registering twice", async function () {
      await deckContract.connect(player1).register("Player One");
      await expect(deckContract.connect(player1).register("Player One Again"))
        .to.be.revertedWith("Player already registered");
    });
  });

  describe("Deck Management", function () {
    beforeEach(async function () {
      await deckContract.connect(player1).register("Player One");
    });

    it("Update deck", async function () {
      const newDeck = Array(30).fill(1); // Assuming 1 is a valid card ID
      await deckContract.connect(player1).updateDeck(newDeck);
      const playerDeck = await deckContract.getPlayerDeck(player1.address);
      expect(playerDeck).to.deep.equal(newDeck);
    });

    it("Should not allow invalid deck size", async function () {
      const invalidDeck = Array(29).fill(1);
      await expect(deckContract.connect(player1).updateDeck(invalidDeck))
        .to.be.revertedWith("Deck must contain exactly 30 cards");
    });
  });

  describe("Pack Opening", function () {
    beforeEach(async function () {
      await deckContract.connect(player1).register("Player One");
      const packId = await mythoriaCards.PACK_START();
      await mythoriaCards.mint(player1.address, packId, 1, "0x"); // Ensure player owns the pack
    });

    it("Open a pack", async function () {
      const packId = await mythoriaCards.PACK_START();
      await expect(deckContract.connect(player1).openPack(packId))
        .to.emit(deckContract, "PackOpened");
    });

    it("Should not open an invalid pack", async function () {
      const invalidPackId = 0;
      await expect(deckContract.connect(player1).openPack(invalidPackId))
        .to.be.revertedWith("Invalid pack ID");
    });
  });

  describe("Card Transfers", function () {
    beforeEach(async function () {
        await deckContract.connect(player1).register("Player One");
        await deckContract.connect(player2).register("Player Two");
        await mythoriaCards.connect(player1).setApprovalForAll(await deckContract.getAddress(), true);
    });

    it("Transfer cards between players", async function () {
        console.log("player1:", player1.address);
        console.log("player2:", player2.address);
        
        // Find a card that player1 has
        let cardIdToTransfer;
        for (let i = 1; i <= 61; i++) {
            const balance = await mythoriaCards.balanceOf(player1.address, i);
            if (balance > 0n) {  
                cardIdToTransfer = i;
                break;
            }
        }
        
        if (!cardIdToTransfer) {
            throw new Error("Player1 has no cards to transfer");
        }

        // Check initial balances
        const initialBalancePlayer1 = await mythoriaCards.balanceOf(player1.address, cardIdToTransfer);
        const initialBalancePlayer2 = await mythoriaCards.balanceOf(player2.address, cardIdToTransfer);
        console.log(`Initial balance player1 (card ${cardIdToTransfer}):`, initialBalancePlayer1.toString());
        console.log(`Initial balance player2 (card ${cardIdToTransfer}):`, initialBalancePlayer2.toString());

        // Transfer all cards of this type from player1 to player2
        for (let i = 0; i < Number(initialBalancePlayer1); i++) {
            await deckContract.connect(player1).transferCard(player2.address, cardIdToTransfer);
        }

        // Check final balances
        const finalBalancePlayer1 = await mythoriaCards.balanceOf(player1.address, cardIdToTransfer);
        const finalBalancePlayer2 = await mythoriaCards.balanceOf(player2.address, cardIdToTransfer);
        console.log(`Final balance player1 (card ${cardIdToTransfer}):`, finalBalancePlayer1.toString());
        console.log(`Final balance player2 (card ${cardIdToTransfer}):`, finalBalancePlayer2.toString());

        // Check the balances to ensure the transfer was successful
        expect(finalBalancePlayer1).to.equal(0n);  // Player1 should have 0 cards of this type left
        expect(finalBalancePlayer2).to.equal(initialBalancePlayer1 + initialBalancePlayer2);  // Player2 should have all the cards now

        // Check internal card balances in DeckContract
        const internalBalancePlayer1 = await deckContract.cardBalance(player1.address, cardIdToTransfer);
        const internalBalancePlayer2 = await deckContract.cardBalance(player2.address, cardIdToTransfer);
        console.log(`Internal balance player1 (card ${cardIdToTransfer}):`, internalBalancePlayer1.toString());
        console.log(`Internal balance player2 (card ${cardIdToTransfer}):`, internalBalancePlayer2.toString());

        expect(internalBalancePlayer1).to.equal(finalBalancePlayer1);
        expect(internalBalancePlayer2).to.equal(finalBalancePlayer2);
    });
});

  

  describe("Admin Functions", function () {
    it("Should increase player stars", async function () {
      await deckContract.connect(player1).register("Player One");
      await deckContract.increasePlayerStars(player1.address, 10);
      const stars = await deckContract.getPlayerStars(player1.address);
      expect(stars).to.equal(10);
    });

    it("Pause and unpause the contract", async function () {
      await deckContract.pause();
      expect(await deckContract.paused()).to.be.true;

      await deckContract.unpause();
      expect(await deckContract.paused()).to.be.false;
    });
  });
});

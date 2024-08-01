const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("CardMarketplace", function () {
  let CardMarketplace, MythoriaCards, MythoriaToken;
  let marketplace, mythoriaCards, mythoriaToken;
  let owner, seller, buyer, bidder;

  beforeEach(async function () {
    [owner, seller, buyer, bidder] = await ethers.getSigners();

    // Deploy MythoriaCards
    MythoriaCards = await ethers.getContractFactory("MythoriaCards");
    mythoriaCards = await upgrades.deployProxy(MythoriaCards, ["https://example.com/"]);

    // Deploy MythoriaToken
    MythoriaToken = await ethers.getContractFactory("MythoriaToken");
    mythoriaToken = await upgrades.deployProxy(MythoriaToken, [await owner.getAddress()]);

    // Deploy CardMarketplace
    CardMarketplace = await ethers.getContractFactory("CardMarketplace");
    marketplace = await upgrades.deployProxy(CardMarketplace, [await mythoriaCards.getAddress(), await mythoriaToken.getAddress()]);

    // Mint some cards and tokens for testing
    await mythoriaCards.mint(await seller.getAddress(), 1, 10, "0x");
    await mythoriaCards.mint(await buyer.getAddress(), 2, 10, "0x");
    await mythoriaToken.mint(await buyer.getAddress(), ethers.parseEther("1000"));
    await mythoriaToken.mint(await bidder.getAddress(), ethers.parseEther("1000"));
    await mythoriaToken.mint(await marketplace.getAddress(), ethers.parseEther("10000")); // Mint tokens to the marketplace

    // Approve marketplace to spend tokens and cards
    await mythoriaCards.connect(seller).setApprovalForAll(await marketplace.getAddress(), true);
    await mythoriaCards.connect(buyer).setApprovalForAll(await marketplace.getAddress(), true);
    await mythoriaToken.connect(buyer).approve(await marketplace.getAddress(), ethers.MaxUint256);
    await mythoriaToken.connect(bidder).approve(await marketplace.getAddress(), ethers.MaxUint256);

    // Mint packs to the marketplace
    const packStart = await mythoriaCards.PACK_START();
    await mythoriaCards.mint(await marketplace.getAddress(), packStart, 1000, "0x");
    await mythoriaCards.mint(await marketplace.getAddress(), packStart + 1n, 1000, "0x");
    await mythoriaCards.mint(await marketplace.getAddress(), packStart + 2n, 1000, "0x");
  });

  describe("Initialization", function () {
    it("Should set the correct MythoriaCards and MythoriaToken addresses", async function () {
      expect(await marketplace.mythoriaCards()).to.equal(await mythoriaCards.getAddress());
      expect(await marketplace.mythoriaToken()).to.equal(await mythoriaToken.getAddress());
    });
  });

  describe("Selling cards to exchange", function () {
    it("Should allow selling cards to the exchange", async function () {
      const cardIds = [1];
      const amounts = [1];
      await expect(marketplace.connect(seller).sellCardsToExchange(cardIds, amounts))
        .to.emit(marketplace, "CardsSoldToExchange")
        .withArgs(await seller.getAddress(), cardIds, amounts, 1);

      expect(await mythoriaCards.balanceOf(await marketplace.getAddress(), 1)).to.equal(1);
      expect(await mythoriaToken.balanceOf(await seller.getAddress())).to.equal(ethers.parseEther("1"));
    });
  });

  describe("Listings", function () {
    it("Should create a listing", async function () {
      const cardIds = [1];
      const amounts = [1];
      const price = ethers.parseEther("10");
      const duration = 86400; // 1 day
    
      await expect(marketplace.connect(seller).createListing(cardIds, amounts, price, duration))
        .to.emit(marketplace, "ListingCreated")
        .withArgs(
          0, // listingId
          await seller.getAddress(), // seller
          cardIds, // cardIds
          amounts, // amounts
          price, // price
          await time.latest() + duration // expirationTime (approximately)
        );
    });

    it("Allow buying a listing", async function () {
      const cardIds = [1];
      const amounts = [1];
      const price = ethers.parseEther("10");
      const duration = 86400; // 1 day

      await marketplace.connect(seller).createListing(cardIds, amounts, price, duration);
      await expect(marketplace.connect(buyer).buyListing(0))
        .to.emit(marketplace, "ListingSold")
        .withArgs(0, await buyer.getAddress());

      expect(await mythoriaCards.balanceOf(await buyer.getAddress(), 1)).to.equal(1);
      expect(await mythoriaToken.balanceOf(await seller.getAddress())).to.equal(price);
    });
  });

  describe("Auctions", function () {
    it("Should create an auction", async function () {
      const cardIds = [1];
      const amounts = [1];
      const duration = 86400n; // 1 day
    
      const latestTime = await time.latest();
    
      await expect(marketplace.connect(seller).createAuction(cardIds, amounts, duration))
        .to.emit(marketplace, "AuctionCreated")
        .withArgs(
          0, // auctionId
          await seller.getAddress(), // seller
          cardIds, // cardIds
          amounts, // amounts
          (endTime) => {
            // Allow for a small time difference (e.g., 2 seconds)
            const expectedEndTime = BigInt(latestTime) + duration;
            return endTime >= expectedEndTime && endTime <= expectedEndTime + 2n;
          }
        );
    });

    it("Allow bidding on an auction", async function () {
      const cardIds = [1];
      const amounts = [1];
      const duration = 86400; // 1 day
      const bidAmount = ethers.parseEther("10");

      await marketplace.connect(seller).createAuction(cardIds, amounts, duration);
      await expect(marketplace.connect(bidder).placeBid(0, bidAmount))
        .to.emit(marketplace, "AuctionBid")
        .withArgs(0, await bidder.getAddress(), bidAmount);
    });

    it("End an auction", async function () {
      const cardIds = [1];
      const amounts = [1];
      const duration = 86400; // 1 day
      const bidAmount = ethers.parseEther("10");

      await marketplace.connect(seller).createAuction(cardIds, amounts, duration);
      await marketplace.connect(bidder).placeBid(0, bidAmount);

      await time.increase(duration + 1);

      await expect(marketplace.endAuction(0))
        .to.emit(marketplace, "AuctionEnded")
        .withArgs(0, await bidder.getAddress(), bidAmount);
    });
  });

  describe("Trade proposals", function () {
    it("Create a trade proposal", async function () {
      const offeredCardIds = [1];
      const offeredAmounts = [1];
      const requestedCardIds = [2];
      const requestedAmounts = [1];
      const duration = 86400; // 1 day

      await expect(marketplace.connect(seller).createTradeProposal(offeredCardIds, offeredAmounts, requestedCardIds, requestedAmounts, duration))
        .to.emit(marketplace, "TradeProposalCreated")
        .withArgs(0, await seller.getAddress());
    });

    it("Accept a trade proposal", async function () {
      const offeredCardIds = [1];
      const offeredAmounts = [1];
      const requestedCardIds = [2];
      const requestedAmounts = [1];
      const duration = 86400; // 1 day

      await marketplace.connect(seller).createTradeProposal(offeredCardIds, offeredAmounts, requestedCardIds, requestedAmounts, duration);

      await expect(marketplace.connect(buyer).acceptTradeProposal(0))
        .to.emit(marketplace, "TradeCompleted")
        .withArgs(0, await buyer.getAddress());
    });
  });

  describe("Reward claiming", function () {
    it("Allow claiming rewards", async function () {
      const stars = 200n;
      const packStart = await mythoriaCards.PACK_START();
      const packId = packStart + 1n; // Rare pack

      await expect(marketplace.connect(buyer).claimReward(stars))
        .to.emit(marketplace, "RewardClaimed")
        .withArgs(await buyer.getAddress(), stars, packId, 3);

      expect(await mythoriaCards.balanceOf(await buyer.getAddress(), packId)).to.equal(3);
    });
  });

  describe("Pack buying", function () {
    it("Allow buying packs", async function () {
      const packStart = await mythoriaCards.PACK_START();
      const amount = 2n;
      const price = ethers.parseEther("4"); // 2 MT per common pack
    
      const initialMarketplaceBalance = await mythoriaToken.balanceOf(await marketplace.getAddress());
    
      await expect(marketplace.connect(buyer).buyPack(packStart, amount))
        .to.emit(marketplace, "PackPurchased")
        .withArgs(await buyer.getAddress(), packStart, amount, price);
    
      expect(await mythoriaCards.balanceOf(await buyer.getAddress(), packStart)).to.equal(amount);
      
      const finalMarketplaceBalance = await mythoriaToken.balanceOf(await marketplace.getAddress());
      expect(finalMarketplaceBalance - initialMarketplaceBalance).to.equal(price);
    });
  });

  describe("Admin functions", function () {
    it("Allow owner to pause and unpause the contract", async function () {
      await marketplace.pause();
      expect(await marketplace.paused()).to.be.true;

      await marketplace.unpause();
      expect(await marketplace.paused()).to.be.false;
    });
  });
});
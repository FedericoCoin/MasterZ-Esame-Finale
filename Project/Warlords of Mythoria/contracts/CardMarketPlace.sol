// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts-upgradeable/token/ERC1155/utils/ERC1155HolderUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "./MythoriaCards.sol";
import "./MythoriaToken.sol";

/// @title CardMarketplace
/// @notice Manages the marketplace for buying, selling, and trading Mythoria cards
contract CardMarketplace is Initializable, ERC1155HolderUpgradeable, OwnableUpgradeable, PausableUpgradeable {
    MythoriaCards public mythoriaCards;
    MythoriaToken public mythoriaToken;

    struct Listing {
        address seller;
        uint256[] cardIds;
        uint256[] amounts;
        uint256 price;
        uint256 expirationTime;
    }

    struct Auction {
        address seller;
        uint256[] cardIds;
        uint256[] amounts;
        uint256 highestBid;
        address highestBidder;
        uint256 endTime;
    }

    struct TradeProposal {
        address proposer;
        uint256[] offeredCardIds;
        uint256[] offeredAmounts;
        uint256[] requestedCardIds;
        uint256[] requestedAmounts;
        uint256 expirationTime;
    }

    mapping(uint256 => Listing) public listings;
    mapping(uint256 => Auction) public auctions;
    mapping(uint256 => TradeProposal) public tradeProposals;
    uint256 public nextListingId;
    uint256 public nextAuctionId;
    uint256 public nextTradeProposalId;

    event CardsSoldToExchange(address seller, uint256[] cardIds, uint256[] amounts, uint256 totalPrice);
    event ListingCreated(uint256 listingId, address seller, uint256[] cardIds, uint256[] amounts, uint256 price, uint256 expirationTime);
    event ListingSold(uint256 listingId, address buyer);
    event AuctionCreated(uint256 auctionId, address seller, uint256[] cardIds, uint256[] amounts, uint256 endTime);
    event AuctionBid(uint256 auctionId, address bidder, uint256 amount);
    event AuctionEnded(uint256 auctionId, address winner, uint256 winningBid);
    event TradeProposalCreated(uint256 proposalId, address proposer);
    event TradeCompleted(uint256 proposalId, address acceptor);
    event RewardClaimed(address user, uint256 stars, uint256 packId, uint256 amount);
    event PackPurchased(address buyer, uint256 packId, uint256 amount, uint256 totalPrice);
    
    /// @notice Initializes the contract with Mythoria Cards and Token addresses
    /// @param _mythoriaCards Address of the MythoriaCards contract
    /// @param _mythoriaToken Address of the MythoriaToken contract
    function initialize(address _mythoriaCards, address _mythoriaToken) public initializer {
        __ERC1155Holder_init();
        __Ownable_init();
        __Pausable_init();
        mythoriaCards = MythoriaCards(_mythoriaCards);
        mythoriaToken = MythoriaToken(_mythoriaToken);
    }
    
     /// @notice Allows a user to buy a pack of cards
    /// @param packId ID of the pack to buy
    /// @param amount Number of packs to buy
    function buyPack(uint256 packId, uint256 amount) external whenNotPaused {
    require(packId >= mythoriaCards.PACK_START() && packId <= mythoriaCards.PACK_END(), "Invalid pack ID");
    uint256 price;
    if (packId == mythoriaCards.PACK_START()) {
        price = 2 * 1e18; // 2 MT for common pack
    } else if (packId == mythoriaCards.PACK_START() + 1) {
        price = 20 * 1e18; // 20 MT for rare pack
    } else if (packId == mythoriaCards.PACK_START() + 2) {
        price = 200 * 1e18; // 200 MT for epic pack
    } else {
        revert("Pack not available for direct purchase");
    }
    uint256 totalPrice = price * amount;
    mythoriaToken.transferFrom(msg.sender, address(this), totalPrice);
    mythoriaCards.safeTransferFrom(address(this), msg.sender, packId, amount, "");
    emit PackPurchased(msg.sender, packId, amount, totalPrice);
}

    /// @notice Allows a user to sell cards to the exchange
    /// @param cardIds Array of card IDs to sell
    /// @param amounts Array of amounts for each card to sell
    function sellCardsToExchange(uint256[] memory cardIds, uint256[] memory amounts) external {
        require(cardIds.length == amounts.length, "Mismatched arrays");
        uint256 totalPrice = 0;
        for (uint256 i = 0; i < cardIds.length; i++) {
            require(cardIds[i] < mythoriaCards.PACK_START(), "Cannot sell packs or legendary cards");
            MythoriaTypes.Rarity rarity = mythoriaCards.getCardAttributes(cardIds[i]).rarity;
            uint256 price = rarity == MythoriaTypes.Rarity.Common ? 1 : (rarity == MythoriaTypes.Rarity.Rare ? 10 : 100);
            totalPrice += price * amounts[i];
            mythoriaCards.safeTransferFrom(msg.sender, address(this), cardIds[i], amounts[i], "");
        }
        mythoriaToken.transfer(msg.sender, totalPrice * 1e18);
        emit CardsSoldToExchange(msg.sender, cardIds, amounts, totalPrice);
    }
    
    /// @notice Creates a new listing for cards
    /// @param cardIds Array of card IDs to list
    /// @param amounts Array of amounts for each card to list
    /// @param price Price for the entire listing
    /// @param duration Duration of the listing in seconds
    function createListing(uint256[] memory cardIds, uint256[] memory amounts, uint256 price, uint256 duration) external {
        require(cardIds.length == amounts.length, "Mismatched arrays");
        require(duration >= 1 hours && duration <= 30 days, "Invalid duration");
        for (uint256 i = 0; i < cardIds.length; i++) {
            mythoriaCards.safeTransferFrom(msg.sender, address(this), cardIds[i], amounts[i], "");
        }
        listings[nextListingId] = Listing(msg.sender, cardIds, amounts, price, block.timestamp + duration);
        emit ListingCreated(nextListingId, msg.sender, cardIds, amounts, price, block.timestamp + duration);
        nextListingId++;
    }
    
    /// @notice Allows a user to buy a listing
    /// @param listingId ID of the listing to buy
    function buyListing(uint256 listingId) external {
        Listing storage listing = listings[listingId];
        require(listing.expirationTime > block.timestamp, "Listing expired");
        mythoriaToken.transferFrom(msg.sender, listing.seller, listing.price);
        for (uint256 i = 0; i < listing.cardIds.length; i++) {
            mythoriaCards.safeTransferFrom(address(this), msg.sender, listing.cardIds[i], listing.amounts[i], "");
        }
        emit ListingSold(listingId, msg.sender);
        delete listings[listingId];
    }
    
    /// @notice Creates a new auction for cards
    /// @param cardIds Array of card IDs to auction
    /// @param amounts Array of amounts for each card to auction
    /// @param duration Duration of the auction in seconds
    function createAuction(uint256[] memory cardIds, uint256[] memory amounts, uint256 duration) external {
        require(cardIds.length == amounts.length, "Mismatched arrays");
        require(duration >= 1 hours && duration <= 30 days, "Invalid duration");
        for (uint256 i = 0; i < cardIds.length; i++) {
            mythoriaCards.safeTransferFrom(msg.sender, address(this), cardIds[i], amounts[i], "");
        }
        auctions[nextAuctionId] = Auction(msg.sender, cardIds, amounts, 0, address(0), block.timestamp + duration);
        emit AuctionCreated(nextAuctionId, msg.sender, cardIds, amounts, block.timestamp + duration);
        nextAuctionId++;
    }
    
    /// @notice Allows a user to place a bid on an auction
    /// @param auctionId ID of the auction to bid on
    /// @param bidAmount Amount of tokens to bid
    function placeBid(uint256 auctionId, uint256 bidAmount) external {
        Auction storage auction = auctions[auctionId];
        require(auction.endTime > block.timestamp, "Auction ended");
        require(bidAmount > auction.highestBid, "Bid too low");
        if (auction.highestBidder != address(0)) {
            mythoriaToken.transfer(auction.highestBidder, auction.highestBid);
        }
        mythoriaToken.transferFrom(msg.sender, address(this), bidAmount);
        auction.highestBid = bidAmount;
        auction.highestBidder = msg.sender;
        emit AuctionBid(auctionId, msg.sender, bidAmount);
    }
    
    /// @notice Ends an auction and distributes cards/tokens
    /// @param auctionId ID of the auction to end
    function endAuction(uint256 auctionId) external {
        Auction storage auction = auctions[auctionId];
        require(auction.endTime <= block.timestamp, "Auction not ended");
        if (auction.highestBidder != address(0)) {
            mythoriaToken.transfer(auction.seller, auction.highestBid);
            for (uint256 i = 0; i < auction.cardIds.length; i++) {
                mythoriaCards.safeTransferFrom(address(this), auction.highestBidder, auction.cardIds[i], auction.amounts[i], "");
            }
            emit AuctionEnded(auctionId, auction.highestBidder, auction.highestBid);
        } else {
            for (uint256 i = 0; i < auction.cardIds.length; i++) {
                mythoriaCards.safeTransferFrom(address(this), auction.seller, auction.cardIds[i], auction.amounts[i], "");
            }
            emit AuctionEnded(auctionId, address(0), 0);
        }
        delete auctions[auctionId];
    }
    
    /// @notice Creates a new trade proposal
    /// @param offeredCardIds Array of card IDs to offer
    /// @param offeredAmounts Array of amounts for each offered card
    /// @param requestedCardIds Array of card IDs to request
    /// @param requestedAmounts Array of amounts for each requested card
    /// @param duration Duration of the trade proposal in seconds
    function createTradeProposal(uint256[] memory offeredCardIds, uint256[] memory offeredAmounts, 
                                 uint256[] memory requestedCardIds, uint256[] memory requestedAmounts, uint256 duration) external {
        require(offeredCardIds.length == offeredAmounts.length && requestedCardIds.length == requestedAmounts.length, "Mismatched arrays");
        require(duration >= 1 hours && duration <= 30 days, "Invalid duration");
        for (uint256 i = 0; i < offeredCardIds.length; i++) {
            mythoriaCards.safeTransferFrom(msg.sender, address(this), offeredCardIds[i], offeredAmounts[i], "");
        }
        tradeProposals[nextTradeProposalId] = TradeProposal(msg.sender, offeredCardIds, offeredAmounts, requestedCardIds, requestedAmounts, block.timestamp + duration);
        emit TradeProposalCreated(nextTradeProposalId, msg.sender);
        nextTradeProposalId++;
    }
     
      /// @notice Accepts a trade proposal
    /// @param proposalId ID of the trade proposal to accept
    function acceptTradeProposal(uint256 proposalId) external {
        TradeProposal storage proposal = tradeProposals[proposalId];
        require(proposal.expirationTime > block.timestamp, "Proposal expired");
        for (uint256 i = 0; i < proposal.requestedCardIds.length; i++) {
            mythoriaCards.safeTransferFrom(msg.sender, proposal.proposer, proposal.requestedCardIds[i], proposal.requestedAmounts[i], "");
        }
        for (uint256 i = 0; i < proposal.offeredCardIds.length; i++) {
            mythoriaCards.safeTransferFrom(address(this), msg.sender, proposal.offeredCardIds[i], proposal.offeredAmounts[i], "");
        }
        emit TradeCompleted(proposalId, msg.sender);
        delete tradeProposals[proposalId];
    }
    
    /// @notice Allows a user to claim a reward based on their star count
    /// @param stars Number of stars the user has
    function claimReward(uint256 stars) external {
        require(stars >= 200 || stars >= 500 || stars >= 1000, "Invalid star count");
        uint256 packId;
        uint256 amount;
        if (stars >= 200) {
            packId = mythoriaCards.PACK_START() + 1; // Rare pack
            amount = 3;
        } else if (stars >= 500) {
            packId = mythoriaCards.PACK_START() + 2; // Epic pack
            amount = 2;
        } else {
            packId = mythoriaCards.PACK_START() + 3; // Legendary pack
            amount = 1;
        }
        mythoriaCards.safeTransferFrom(address(this), msg.sender, packId, amount, "");
        emit RewardClaimed(msg.sender, stars, packId, amount);
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }
}
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts-upgradeable/token/ERC1155/utils/ERC1155HolderUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "./MythoriaCards.sol";
import "./MythoriaToken.sol";

/// @title DeckContract
/// @notice Manages player decks and card ownership for Mythoria
contract DeckContract is Initializable, ERC1155HolderUpgradeable, OwnableUpgradeable, PausableUpgradeable {
    MythoriaCards public mythoriaCards;
    MythoriaToken public mythoriaToken;

    struct Player {
        string name;
        uint256 stars;
        uint256[] deck;
        bool isDeckValidated;
    }

    mapping(address => Player) public players;
    mapping(address => mapping(uint256 => uint256)) public cardBalance;

    uint256 private constant DECK_SIZE = 30;
    uint256 private constant MIN_DECK_SIZE = 15;

    event PlayerRegistered(address indexed player, string name);
    event DeckUpdated(address indexed player);
    event DeckValidated(address indexed player);
    event PackOpened(address indexed opener, uint256 packId, uint256[] cardIds);
    event CardTransferred(address indexed from, address indexed to, uint256 cardId);


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
    /// @notice Registers a new player and distributes initial cards and tokens
    /// @param _name Name of the player
   function register(string memory _name) external {
    require(bytes(players[msg.sender].name).length == 0, "Player already registered");

    players[msg.sender] = Player({
        name: _name,
        stars: 0,
        deck: new uint256[](0),
        isDeckValidated: false
    });

    // Distribute initial cards
    uint256[] memory commonCreatures = getRandomCards(15, MythoriaTypes.Rarity.Common, true);
    uint256[] memory commonItems = getRandomCards(10, MythoriaTypes.Rarity.Common, false);
    uint256[] memory rareCards = getRandomCards(5, MythoriaTypes.Rarity.Rare, true);

    for (uint256 i = 0; i < commonCreatures.length; i++) {
        if (commonCreatures[i] > 0) {
            cardBalance[msg.sender][commonCreatures[i]] += 1;
            uint256 balance = mythoriaCards.balanceOf(address(this), commonCreatures[i]);
            require(balance > 0, string(abi.encodePacked("Insufficient balance for card ", Strings.toString(commonCreatures[i]))));
            mythoriaCards.safeTransferFrom(address(this), msg.sender, commonCreatures[i], 1, "");
        }
    }

    for (uint256 i = 0; i < commonItems.length; i++) {
         if (commonItems[i] > 0) {
        cardBalance[msg.sender][commonItems[i]] += 1;
        uint256 balance = mythoriaCards.balanceOf(address(this), commonItems[i]);
        require(balance > 0, string(abi.encodePacked("Insufficient balance for card ", Strings.toString(commonItems[i]))));
        mythoriaCards.safeTransferFrom(address(this), msg.sender, commonItems[i], 1, "");
         }
    }

    for (uint256 i = 0; i < rareCards.length; i++) {
        if (rareCards[i] > 0) {
        cardBalance[msg.sender][rareCards[i]] += 1;
        uint256 balance = mythoriaCards.balanceOf(address(this), rareCards[i]);
        require(balance > 0, string(abi.encodePacked("Insufficient balance for card ", Strings.toString(rareCards[i]))));
        mythoriaCards.safeTransferFrom(address(this), msg.sender, rareCards[i], 1, "");
        }
    }

    // Distribute initial tokens and pack
    mythoriaToken.transfer(msg.sender, 10 * 10**18); // 10 Mythoria tokens
    uint256 packId = mythoriaCards.PACK_START() + 1;
    uint256 packBalance = mythoriaCards.balanceOf(address(this), packId);
    require(packBalance > 0, "Insufficient balance for pack");
    mythoriaCards.safeTransferFrom(address(this), msg.sender, packId, 1, ""); // 1 rare pack

    emit PlayerRegistered(msg.sender, _name);
}
     /// @notice Opens a pack and distributes cards to the player
    /// @param packId ID of the pack to open
     function openPack(uint256 packId) public whenNotPaused {
        require(packId >= mythoriaCards.PACK_START() && packId <= mythoriaCards.PACK_END(), "Invalid pack ID");
        require(mythoriaCards.balanceOf(msg.sender, packId) > 0, "You don't own this pack");

        MythoriaTypes.CardMetadata memory packMetadata = mythoriaCards.getCardAttributes(packId);
        uint256[] memory cardIds = new uint256[](
            packMetadata.commonCardsContained +
            packMetadata.rareCardsContained +
            packMetadata.epicCardsContained +
            packMetadata.legendaryCardsContained
        );

        uint256 index = 0;
        index = _addRandomCards(cardIds, index, MythoriaTypes.Rarity.Common, packMetadata.commonCardsContained);
        index = _addRandomCards(cardIds, index, MythoriaTypes.Rarity.Rare, packMetadata.rareCardsContained);
        index = _addRandomCards(cardIds, index, MythoriaTypes.Rarity.Epic, packMetadata.epicCardsContained);
        index = _addRandomCards(cardIds, index, MythoriaTypes.Rarity.Legendary, packMetadata.legendaryCardsContained);

        for (uint256 i = 0; i < cardIds.length; i++) {
            mythoriaCards.transferCard(owner(), msg.sender, cardIds[i], 1);
        }

        mythoriaCards.transferCard(msg.sender, owner(), packId, 1);

        emit PackOpened(msg.sender, packId, cardIds);
    }

    function _addRandomCards(uint256[] memory cardIds, uint256 startIndex, MythoriaTypes.Rarity rarity, uint256 count) internal view returns (uint256) {
        uint256[] memory cardsOfRarity = mythoriaCards.getCardsByRarity(rarity);
        for (uint256 i = 0; i < count; i++) {
            uint256 randomIndex = uint256(keccak256(abi.encodePacked(block.timestamp, block.prevrandao, msg.sender, i))) % cardsOfRarity.length;
            cardIds[startIndex + i] = cardsOfRarity[randomIndex];
        }
        return startIndex + count;
    }
    /// @notice Updates a player's deck
    /// @param _newDeck Array of card IDs for the new deck
    function updateDeck(uint256[] memory _newDeck) external {
    require(_newDeck.length == DECK_SIZE, "Deck must contain exactly 30 cards");
    uint256 creatureCount = 0;
    for (uint256 i = 0; i < _newDeck.length; i++) {
        require(cardBalance[msg.sender][_newDeck[i]] > 0, "Player doesn't own this card");
        require(_newDeck[i] < mythoriaCards.PACK_START(), "Pack cards are not allowed in deck");
        if (_newDeck[i] <= mythoriaCards.CREATURE_END()) {
            creatureCount++;
        }
    }
    require(creatureCount >= 15, "Deck must contain at least 15 creature cards");

    players[msg.sender].deck = _newDeck;
    players[msg.sender].isDeckValidated = true;

    emit DeckUpdated(msg.sender);
}
     /// @notice Retrieves a player's deck
    /// @param _player Address of the player
    /// @return uint256[] Array of card IDs in the player's deck
    function getPlayerDeck(address _player) external view returns (uint256[] memory) {
        return players[_player].deck;
    }
    
    /// @notice Retrieves a player's star count
    /// @param _player Address of the player
    /// @return uint256 Number of stars the player has
    function getPlayerStars(address _player) external view returns (uint256) {
        return players[_player].stars;
    }
    
    /// @notice Increases a player's star count
    /// @param _player Address of the player
    /// @param _amount Amount of stars to add
    function increasePlayerStars(address _player, uint256 _amount) external onlyOwner {
        players[_player].stars += _amount;
    }
    
    /// @notice Transfers a card from one player to another
    /// @param _to Address of the recipient
    /// @param _cardId ID of the card to transfer
    function transferCard(address _to, uint256 _cardId) external {
    require(cardBalance[msg.sender][_cardId] > 0, "Insufficient card balance");
    require(_to != address(0), "Invalid recipient");


    // Update internal card balances
    cardBalance[msg.sender][_cardId] -= 1;
    cardBalance[_to][_cardId] += 1;

    // Perform the actual transfer in the ERC1155 contract
    mythoriaCards.safeTransferFrom(msg.sender, _to, _cardId, 1, "");

    emit CardTransferred(msg.sender, _to, _cardId);
}


    /// @notice Transfers multiple cards from one player to another
    /// @param _to Address of the recipient
    /// @param _cardIds Array of card IDs to transfer
    /// @param _amounts Array of amounts for each card to transfer
    function batchTransferCards(address _to, uint256[] memory _cardIds, uint256[] memory _amounts) external {
        require(_cardIds.length == _amounts.length, "Arrays length mismatch");
        for (uint256 i = 0; i < _cardIds.length; i++) {
            require(cardBalance[msg.sender][_cardIds[i]] >= _amounts[i], "Insufficient card balance");
            require(_cardIds[i] < mythoriaCards.PACK_START(), "Pack cards cannot be transferred");
            cardBalance[msg.sender][_cardIds[i]] -= _amounts[i];
            cardBalance[_to][_cardIds[i]] += _amounts[i];
            mythoriaCards.safeTransferFrom(msg.sender, _to, _cardIds[i], _amounts[i], "");
        }
    }

    function getRandomCards(uint256 _count, MythoriaTypes.Rarity _rarity, bool _includeCreatures) internal view returns (uint256[] memory) {
    uint256[] memory allCards = mythoriaCards.getCardsByRarity(_rarity);
    uint256[] memory selectedCards = new uint256[](_count);
    uint256 selectedCount = 0;

    for (uint256 i = 0; i < allCards.length && selectedCount < _count; i++) {
        if (allCards[i] > 0 && (_includeCreatures || allCards[i] > mythoriaCards.CREATURE_END())) {
            selectedCards[selectedCount] = allCards[i];
            selectedCount++;
        }
    }

    // Shuffle the selected cards
    for (uint256 i = 0; i < selectedCount; i++) {
        uint256 j = i + uint256(keccak256(abi.encodePacked(block.timestamp, block.prevrandao, i))) % (selectedCount - i);
        (selectedCards[i], selectedCards[j]) = (selectedCards[j], selectedCards[i]);
    }

    return selectedCards;
}

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }
}
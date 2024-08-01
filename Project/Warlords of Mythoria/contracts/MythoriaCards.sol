// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts-upgradeable/token/ERC1155/extensions/ERC1155SupplyUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "./MythoriaTypes.sol";

/// @title MythoriaCards
/// @notice ERC1155 Token for Mythoria marketplace with upgradeable functionality
contract MythoriaCards is Initializable, ERC1155SupplyUpgradeable, OwnableUpgradeable {
    using Strings for uint256;
    using MythoriaTypes for MythoriaTypes.CardMetadata;
    
    // Card ID ranges
    uint256 public constant CREATURE_START = 1;
    uint256 public constant CREATURE_END = 36;
    uint256 public constant ITEM_START = 37;
    uint256 public constant ITEM_END = 57;
    uint256 public constant PACK_START = 58;
    uint256 public constant PACK_END = 61;

    string private _baseUri;
 
    enum Rarity { Common, Rare, Epic, Legendary }

    struct CardMetadata {
        string name;
        string cardType;
        Rarity rarity;
        uint256 attack;
        uint256 defense;
        uint256 hp;
        uint256 speed;
        uint256 deploymentCost;
        uint256 attackCost;
        string evolutionStage;
        string nextEvolution;
        string evolveFrom;
        bool canEvolve;
        bool isEvolved;
        uint256 speedBoost;
        uint256 attackBoost;
        uint256 defenceBoost;
        uint256 hpBoost;
        uint256 damage;
        uint256 hpRecovery;
        uint256 opponentAttackDecrease;
        uint256 opponentSpeedDecrease;
        uint256 opponentDefenceDecrease;
        bool canTrade;
        bool isAttachable;
        uint256 manaGain;
        uint256 commonCardsContained;
        uint256 rareCardsContained;
        uint256 epicCardsContained;
        uint256 legendaryCardsContained;
    }
    
    // Card metadata storage
    mapping(uint256 => MythoriaTypes.CardMetadata) public cards;
    mapping(uint256 => string) private _uris;
    mapping(uint256 => uint256) private _legendaryCardSupply;
    
    event CardTransferred(address indexed from, address indexed to, uint256 cardId, uint256 amount);
    
    /// @notice Initializes the contract with base URI and sets up initial card supply
    /// @param baseUri Base URI for token metadata
    function initialize(string memory baseUri) public initializer {
        __ERC1155_init("");
        __ERC1155Supply_init();
        __Ownable_init();
        _baseUri = baseUri;
        _setupCardMetadata();
        _mintInitialSupply();
    }
    
     /// @notice Sets a new base URI for all token metadata
    /// @param newuri New base URI
    function setBaseURI(string memory newuri) public onlyOwner {
        _baseUri = newuri;
    }
    
    /// @notice Returns the metadata URI for a given token ID
    /// @param tokenId ID of the token
    /// @return string URI for the token metadata
    function uri(uint256 tokenId) public view virtual override returns (string memory) {
        string memory tokenUri = _uris[tokenId];
        if (bytes(tokenUri).length > 0) {
            return tokenUri;
        }
        return string(abi.encodePacked(_baseUri, tokenId.toString(), ".json"));
    }
    
    /// @notice Sets a specific URI for a token ID
    /// @param tokenId ID of the token
    /// @param tokenUri URI for the token metadata
    function setTokenUri(uint256 tokenId, string memory tokenUri) public onlyOwner {
        require(bytes(_uris[tokenId]).length == 0, "Cannot set uri twice");
        _uris[tokenId] = tokenUri;
    }
    
    /// @notice Mints new tokens
    /// @param account The account to receive the tokens
    /// @param id The token id
    /// @param amount The amount of tokens to mint
    /// @param data Additional data
    function mint(address account, uint256 id, uint256 amount, bytes memory data) public onlyOwner {
    _mint(account, id, amount, data);
}
    
    function mintBatch(address to, uint256[] memory ids, uint256[] memory amounts, bytes memory data) public onlyOwner {
        _mintBatch(to, ids, amounts, data);
    }
 
     /// @notice Transfers a card from one address to another
    /// @param from Address to transfer from
    /// @param to Address to transfer to
    /// @param cardId ID of the card to transfer
    /// @param amount Amount of cards to transfer
     function transferCard(address from, address to, uint256 cardId, uint256 amount) public {
        require(balanceOf(from, cardId) >= amount, "Insufficient balance");
        _safeTransferFrom(from, to, cardId, amount, "");
        emit CardTransferred(from, to, cardId, amount);
    }
    
    /// @notice Retrieves the attributes of a card
    /// @param cardId ID of the card
    /// @return CardMetadata Metadata of the card
    function getCardAttributes(uint256 cardId) public view returns (MythoriaTypes.CardMetadata memory) {
        require(cardId >= CREATURE_START && cardId <= PACK_END, "Invalid card ID");
        return cards[cardId];
    }
    
    /// @dev Sets up initial card metadata
    function _setupCardMetadata() internal {
        // This function will be called CardMetadataSetup contract
    }
    
    /// @dev Mints initial supply of cards
    function _mintInitialSupply() internal {
        for (uint256 i = CREATURE_START; i <= ITEM_END; i++) {
            if (cards[i].rarity == MythoriaTypes.Rarity.Common) {
                _mint(msg.sender, i, 1000, "");
            } else if (cards[i].rarity == MythoriaTypes.Rarity.Rare) {
                _mint(msg.sender, i, 100, "");
            } else if (cards[i].rarity == MythoriaTypes.Rarity.Epic) {
                _mint(msg.sender, i, 10, "");
            } else if (cards[i].rarity == MythoriaTypes.Rarity.Legendary && i <= CREATURE_END) {
                _mint(msg.sender, i, 1, "");
                _legendaryCardSupply[i] = 1;
            }
        }

        _mint(msg.sender, 58, 5000, ""); // Common Pack
        _mint(msg.sender, 59, 300, "");  // Rare Pack
        _mint(msg.sender, 60, 40, "");  // Epic Pack
        _mint(msg.sender, 61, 3, "");   // Legendary Pack
    }


   function _getRandomCard(MythoriaTypes.Rarity targetRarity) internal view returns (uint256) {
        uint256[] memory eligibleCards = new uint256[](ITEM_END - CREATURE_START + 1);
        uint256 count = 0;

        for (uint256 i = CREATURE_START; i <= ITEM_END; i++) {
            if (cards[i].rarity == targetRarity) {
                if (targetRarity == MythoriaTypes.Rarity.Legendary) {
                    if (_legendaryCardSupply[i] > 0) {
                        eligibleCards[count] = i;
                        count++;
                    }
                } else {
                    eligibleCards[count] = i;
                    count++;
                }
            }
        }

        require(count > 0, "No cards of the target rarity");
        return eligibleCards[_random(count)];
    }

    function _random(uint256 max) internal view returns (uint256) {
    return uint256(keccak256(abi.encodePacked(block.timestamp, block.prevrandao, msg.sender))) % max;
    }
    
    /// @notice Updates the metadata of a card
    /// @param cardId ID of the card to update
    /// @param newMetadata New metadata for the card
    function updateCardMetadata(uint256 cardId, MythoriaTypes.CardMetadata memory newMetadata) public onlyOwner {
        require(cardId >= CREATURE_START && cardId <= PACK_END, "Invalid card ID");
        cards[cardId] = newMetadata;
    }
     
     /// @notice Retrieves all card IDs of a specific rarity
     function getCardsByRarity(MythoriaTypes.Rarity rarity) public view returns (uint256[] memory) {
        uint256[] memory cardIds = new uint256[](PACK_END - CREATURE_START + 1);
        uint256 count = 0;

        for (uint256 i = CREATURE_START; i <= PACK_END; i++) {
            if (cards[i].rarity == rarity) {
                cardIds[count] = i;
                count++;
            }
        }

        uint256[] memory result = new uint256[](count);
        for (uint256 i = 0; i < count; i++) {
            result[i] = cardIds[i];
        }

        return result;
    }
}
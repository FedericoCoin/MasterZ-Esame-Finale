// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Supply.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";


/// @title Card Contract
/// @dev This contract is an ERC1155 token that represents various cards with different rarities.

contract Card is ERC1155Supply, Ownable {
    using Strings for uint256;
    
    // Define token ID constants for different card types
    uint256 public constant CREATURE_START = 1;
    uint256 public constant CREATURE_END = 10;
    uint256 public constant COMMON_PACK = 11;
    uint256 public constant RARE_PACK = 12;
    uint256 public constant EPIC_PACK = 13;
    uint256 public constant LEGENDARY_PACK = 14;

    string private _baseUri;
 
    // Enum for card rarities
    enum Rarity { Common, Rare, Epic, Legendary }

    // Struct to store metadata for creatures
    struct CreatureMetadata {
        string creatureType;
        Rarity rarity;
    }
    
    // Mapping from token ID to creature metadata
    mapping(uint256 => CreatureMetadata) public creatures;
    // Mapping from token ID to custom URIs
    mapping(uint256 => string) private _uris;
    
    // Event emitted when a pack is opened
    event PackOpened(address indexed opener, uint256 packId, uint256[] creatures);
    
    // @dev Constructor that initializes the contract by setting up metadata and minting initial supply
    constructor() ERC1155("") {
        _setupCreatureMetadata();
        _mintInitialSupply();
    }
    
    /// @notice Set the base URI for the metadata.
    function setURI(string memory newuri) public onlyOwner {
        _baseUri = newuri;
    }
    
    /// @notice Get the URI for a specific token ID.
    function uri(uint256 tokenId) public view virtual override returns (string memory) {
        string memory tokenUri = _uris[tokenId];
        if (bytes(tokenUri).length > 0) {
            return tokenUri;
        }
        return string(abi.encodePacked(_baseUri, tokenId.toString(), ".json"));
    }
    
    /// @notice Set a custom URI for a specific token ID.
    function setTokenUri(uint256 tokenId, string memory tokenUri) public onlyOwner {
        require(bytes(_uris[tokenId]).length == 0, "Cannot set uri twice");
        _uris[tokenId] = tokenUri;
    }
    
    /// @notice Mint new tokens.
    function mint(address to, uint256 id, uint256 amount, bytes memory data) public onlyOwner {
        _mint(to, id, amount, data);
    }
    
    /// @notice Mint multiple new tokens in a batch.
    function mintBatch(address to, uint256[] memory ids, uint256[] memory amounts, bytes memory data) public onlyOwner {
        _mintBatch(to, ids, amounts, data);
    }
 

    /// @notice Open a pack and get assigned creatures.
    /// @param packId The ID of the pack to open.
    /// @return assignedCreatures The IDs of the assigned creatures.
    function openPack(uint256 packId) public {
        require(packId >= COMMON_PACK && packId <= LEGENDARY_PACK, "Invalid pack ID");
        require(balanceOf(msg.sender, packId) > 0, "You don't own this pack");

        uint256[] memory assignedCreatures = new uint256[](3);

        if (packId == COMMON_PACK) {
            for (uint256 i = 0; i < 3; i++) {
                assignedCreatures[i] = _getRandomCreature(Rarity.Common);
            }
        } else if (packId == RARE_PACK) {
            assignedCreatures = _openRarePack();
        } else if (packId == EPIC_PACK) {
            assignedCreatures = _openEpicPack();
        } else if (packId == LEGENDARY_PACK) {
            assignedCreatures = _openLegendaryPack();
        }

        for (uint256 i = 0; i < 3; i++) {
            _mint(msg.sender, assignedCreatures[i], 1, "");
        }

        _burn(msg.sender, packId, 1);

        emit PackOpened(msg.sender, packId, assignedCreatures);
    }

    function getCreatureAttributes(uint256 creatureId) public view returns (string memory creatureType, string memory rarity) {
        require(creatureId >= CREATURE_START && creatureId <= CREATURE_END, "Invalid creature ID");
        CreatureMetadata memory metadata = creatures[creatureId];
        return (metadata.creatureType, _rarityToString(metadata.rarity));
    }
    
    /// @dev Setup initial metadata for creatures.
    function _setupCreatureMetadata() private {
        creatures[1] = CreatureMetadata("Skeleton", Rarity.Common);
        creatures[2] = CreatureMetadata("Goblin Scout", Rarity.Common);
        creatures[3] = CreatureMetadata("Farmhand", Rarity.Common);
        creatures[4] = CreatureMetadata("Archer Apprentice", Rarity.Common);
        creatures[5] = CreatureMetadata("Shadow Assassin", Rarity.Rare);
        creatures[6] = CreatureMetadata("Golem", Rarity.Rare);
        creatures[7] = CreatureMetadata("Phoenix", Rarity.Epic);
        creatures[8] = CreatureMetadata("War Elephant", Rarity.Epic);
        creatures[9] = CreatureMetadata("Abyssal Kraken", Rarity.Legendary);
        creatures[10] = CreatureMetadata("Fire Drake", Rarity.Legendary);
    }

    /// @dev Mint initial supply of tokens.
    function _mintInitialSupply() private {
        for (uint256 i = CREATURE_START; i <= CREATURE_END; i++) {
            if (creatures[i].rarity == Rarity.Common) {
                _mint(msg.sender, i, 1000, "");
            } else if (creatures[i].rarity == Rarity.Rare) {
                _mint(msg.sender, i, 100, "");
            } else if (creatures[i].rarity == Rarity.Epic) {
                _mint(msg.sender, i, 10, "");
            } else if (creatures[i].rarity == Rarity.Legendary) {
                _mint(msg.sender, i, 1, "");
            }
        }

        _mint(msg.sender, COMMON_PACK, 300, "");
        _mint(msg.sender, RARE_PACK, 30, "");
        _mint(msg.sender, EPIC_PACK, 10, "");
        _mint(msg.sender, LEGENDARY_PACK, 2, "");
    }
    /// @dev Get a random creature ID based on the specified rarity.
    function _getRandomCreature(Rarity targetRarity) private view returns (uint256) {
        uint256[] memory eligibleCreatures = new uint256[](10);
        uint256 count = 0;

        for (uint256 i = CREATURE_START; i <= CREATURE_END; i++) {
            if (creatures[i].rarity == targetRarity) {
                eligibleCreatures[count] = i;
                count++;
            }
        }

        require(count > 0, "No creatures of the target rarity");
        return eligibleCreatures[_random(count)];
    }
    
    /// @dev function to open a rare pack.
    function _openRarePack() private view returns (uint256[] memory) {
        uint256[] memory assignedCreatures = new uint256[](3);
        if (_random(100) < 20) {
            assignedCreatures[0] = _getRandomCreature(Rarity.Rare);
            assignedCreatures[1] = _getRandomCreature(Rarity.Rare);
            assignedCreatures[2] = _getRandomCreature(Rarity.Common);
        } else {
            assignedCreatures[0] = _getRandomCreature(Rarity.Rare);
            assignedCreatures[1] = _getRandomCreature(Rarity.Common);
            assignedCreatures[2] = _getRandomCreature(Rarity.Common);
        }
        return assignedCreatures;
    }
    
    /// @dev function to open a epic pack.
    function _openEpicPack() private view returns (uint256[] memory) {
        uint256[] memory assignedCreatures = new uint256[](3);
        assignedCreatures[0] = _getRandomCreature(Rarity.Epic);
        if (_random(100) < 10) {
            assignedCreatures[1] = _getRandomCreature(Rarity.Epic);
            assignedCreatures[2] = _random(2) == 0 ? _getRandomCreature(Rarity.Common) : _getRandomCreature(Rarity.Rare);
        } else {
            assignedCreatures[1] = _random(2) == 0 ? _getRandomCreature(Rarity.Common) : _getRandomCreature(Rarity.Rare);
            assignedCreatures[2] = _random(2) == 0 ? _getRandomCreature(Rarity.Common) : _getRandomCreature(Rarity.Rare);
        }
        return assignedCreatures;
    }
    
    /// @dev function to open a legendary pack.
    function _openLegendaryPack() private view returns (uint256[] memory) {
        uint256[] memory assignedCreatures = new uint256[](3);
        if (_random(100) < 80) {
            assignedCreatures[0] = _getRandomCreature(Rarity.Legendary);
            assignedCreatures[1] = _getRandomCreature(Rarity.Epic);
            assignedCreatures[2] = _random(2) == 0 ? _getRandomCreature(Rarity.Rare) : _getRandomCreature(Rarity.Epic);
        } else {
            assignedCreatures[0] = _getRandomCreature(Rarity.Epic);
            assignedCreatures[1] = _getRandomCreature(Rarity.Epic);
            assignedCreatures[2] = _getRandomCreature(Rarity.Rare);
        }
        return assignedCreatures;
    }

    /// @dev Convert rarity enum to string.
    function _rarityToString(Rarity rarity) private pure returns (string memory) {
        if (rarity == Rarity.Common) return "Common";
        if (rarity == Rarity.Rare) return "Rare";
        if (rarity == Rarity.Epic) return "Epic";
        if (rarity == Rarity.Legendary) return "Legendary";
        revert("Invalid rarity");
    }

     /// @dev Generate a random number within a specified range.
    function _random(uint256 max) private view returns (uint256) {
        return uint256(keccak256(abi.encodePacked(block.timestamp, block.prevrandao, msg.sender))) % max;
    }
}
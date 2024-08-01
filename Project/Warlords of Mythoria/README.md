# Warlords Mythoria Card Game

Warlords Mythoria is an innovative blockchain-based card game built entirely on Solidity. This project leverages smart contracts to manage card ownership, trading, and gameplay mechanics.

## Features

- ERC1155 NFT cards representing creatures, items, and packs
- ERC20 token (MT) for in-game economy
- Deck building and management
- Card marketplace with various trading options
- Reward system based on player performance

## Smart Contracts

### MythoriaCards (ERC1155)

- Manages 61 unique cards (36 creatures, 21 items, 4 packs)
- Implements minting rules for different card rarities
- Provides functions for card data retrieval and metadata management

### MythoriaToken (ERC20)

- Name: Mythoria Token
- Symbol: MT
- Initial supply: 1 billion tokens
- Maximum supply: 10 billion tokens

### DeckContract

- Handles player registration and initial card distribution
- Manages player decks and card ownership
- Implements deck validation rules

### CardMarketPlace

- Enables players to sell cards to the marketplace
- Facilitates player-to-player card sales and auctions
- Implements card trading between players
- Manages reward distribution based on player stars

## Card Collection

The Mythoria card collection can be viewed on OpenSea:
[Mythoria Cards on OpenSea](https://testnets.opensea.io/assets/sepolia/0xf9e1cb4906e3ba38f075e243ba4edc9c6ae76f27)

## Metadata

Card metadata is stored on IPFS:
`ipfs://QmVQG1RrJt7DUGKH9FtVHcTY8og2H8t7kywm36kH7dQc1c`

## Testing
Comprehensive test suites are available for all contracts, aiming for 100% coverage.

## Future Development
Implementation of battle features

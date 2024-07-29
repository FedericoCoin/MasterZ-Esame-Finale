# ERC1155 Card Game Contract

This project implements an ERC1155 smart contract for a card game, featuring both fungible and non-fungible elements. It includes creature cards of various rarities and pack tokens that can be opened to receive random creatures.

## Project Overview

The main components of this project are:

1. Card Contract: An ERC1155 token contract representing various cards and packs.
2. Creature Cards: Non-fungible and fungible tokens with different rarities (Common, Rare, Epic, Legendary).
3. Pack Tokens: Fungible tokens that can be opened to receive random creature cards.

## Key Features

- Minting of creature cards and pack tokens
- Opening packs to receive random creature cards
- Custom metadata for each creature card
- Support for both fungible and non-fungible tokens in a single contract

## Contracts

1. `Card.sol`: Main ERC1155 contract implementing the card game logic.

## Testing

The project includes comprehensive tests (`Card.test.js`) covering various scenarios such as:
- Contract deployment and initial supply
- Creature metadata retrieval
- Minting and transferring tokens
- Opening packs and receiving random creatures
- URI handling for token metadata

## IPFS Integration

Images and metadata for the creature cards are stored on IPFS, ensuring decentralized and persistent storage. The contract allows setting a base URI for all tokens and custom URIs for specific tokens.

## Deployment and Verification

The contract has been deployed on the Sepolia testnet and verified for transparency. 

## Marketplace Integration

The card collection can be viewed on OpenSea at the following link:
[OpenSea Collection](https://testnets.opensea.io/collection/unidentified-contract-aa67b773-4a6c-4f57-8f8a-7ce8)

# Token Factory Project

This project implements factory contracts for deploying and managing both ERC20 and ERC721 (NFT) tokens. It allows for easy creation and management of multiple token collections.

## Project Overview

The main components of this project are:

1. ERC20 Token Contract: A standard ERC20 token with additional features.
2. ERC20 Token Factory: A factory contract for deploying and managing multiple ERC20 token contracts.
3. NFT Token Contract: An ERC721 token contract with additional features like pausing and blacklisting.
4. NFT Token Factory: A factory contract for deploying and managing multiple NFT token contracts.

## Key Features

- Deployment of new ERC20 and ERC721 token contracts
- Minting of tokens (both ERC20 and NFTs)
- Pausing and unpausing of token contracts
- Blacklisting of addresses
- Management of multiple token collections through single factory contracts

## Contracts

1. `ERC20Token.sol`: ERC20 token contract with additional features.
2. `ERC20TokenFactory.sol`: Factory contract for deploying and managing ERC20 token contracts.
3. `MyNFTToken.sol`: ERC721 token contract with additional features.
4. `MyNFTTokenFactory.sol`: Factory contract for deploying and managing NFT token contracts.

## Testing

The project includes comprehensive tests covering various scenarios for both ERC20 and ERC721 tokens:

- `ERC20TokenFactory.test.js`: Tests for ERC20 token deployment and management.
- `MyNFTTokenFactory.test.js`: Tests for NFT token deployment and management.

Tests cover scenarios such as:
- Factory contract deployment
- Token contract deployment (both ERC20 and ERC721)
- Minting tokens
- Pausing and unpausing token contracts
- Blacklisting addresses
- Access control for various operations

## Key Functionalities

### ERC20Token
- Minting of tokens
- Pausing and unpausing token transfers
- Blacklisting of addresses

### ERC20TokenFactory
- Deployment of new ERC20 token contracts
- Tracking of deployed ERC20 contracts

### MyNFTToken
- Minting of NFTs
- Pausing and unpausing token transfers
- Blacklisting of addresses
- URI management for token metadata

### MyNFTTokenFactory
- Deployment of new NFT token contracts
- Tracking of deployed NFT contracts
- Pausing and unpausing of deployed NFT contracts


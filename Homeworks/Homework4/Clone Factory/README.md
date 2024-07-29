# ERC20 Clone Factory Project

This project implements a factory contract for deploying and managing ERC20 tokens using the clone factory pattern. It allows for easy creation and management of multiple ERC20 token collections.

## Project Overview

The main components of this project are:

1. ERC20 Token Contract: A standard ERC20 token with additional features like pausing and blacklisting.
2. ERC20 Token Factory: A factory contract for deploying and managing multiple ERC20 token contracts using the clone factory pattern.

## Key Features

- Deployment of new ERC20 token contracts using minimal proxy clones
- Minting of tokens
- Pausing and unpausing of token contracts
- Blacklisting of addresses
- Management of multiple token collections through a single factory contract

## Contracts

1. `ERC20Token.sol`: ERC20 token contract with additional features.
2. `ERC20TokenFactory.sol`: Factory contract for deploying and managing ERC20 token contracts using the clone factory pattern.

## Testing

The project includes comprehensive tests covering various scenarios for the ERC20 token factory:

- `ERC20CloneFactory.test.js`: Tests for ERC20 token deployment and management.

Tests cover scenarios such as:
- Factory contract deployment
- Token contract deployment
- Minting tokens
- Pausing and unpausing token contracts
- Blacklisting addresses
- Access control for various operations

## Key Functionalities

### ERC20Token
- Minting of tokens
- Pausing and unpausing token transfers
- Blacklisting of addresses
- Role-based access control

### ERC20TokenFactory
- Deployment of new ERC20 token contracts using minimal proxy clones
- Tracking of deployed ERC20 contracts
- Enumeration of deployed tokens


# Simple DEX with Safe

This project implements a Simple Decentralized Exchange (DEX) with an additional Safe contract for secure storage of Ether and tokens.

## Project Overview

The main components of this project are:

1. SimpleDEX: A basic decentralized exchange for buying and selling ERC20 tokens using Ether.
2. Safe: A contract that acts as a secure storage for Ether and tokens used by the DEX.
3. PriceConsumer: A contract that fetches ETH/USD price from Chainlink oracle (with a mock for testing).
4. Token: A basic ERC20 token for testing purposes.

## Key Features

- Buy tokens with Ether
- Sell tokens for Ether
- Secure storage of funds in a separate Safe contract
- Price oracle integration for ETH/USD conversion
- Emergency transfer functionality
- Pausable operations

## Contracts

1. `SimpleDEX.sol`: Main DEX contract with buying and selling functionality.
2. `Safe.sol`: Secure storage for Ether and tokens.
3. `PriceConsumer.sol`: Chainlink price feed consumer (with mock functionality for testing).
4. `Token.sol`: Sample ERC20 token for testing.

## Testing

The project includes comprehensive tests covering various scenarios such as:
- Token minting and transfers
- Price feed functionality
- Safe deposits and withdrawals
- DEX token buying and selling
- Emergency transfers


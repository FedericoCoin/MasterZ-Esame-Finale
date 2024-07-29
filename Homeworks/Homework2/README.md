# MultiTokenWallet with NFT Sale Support

This project implements a MultiTokenWallet contract that supports handling various tokens, including native cryptocurrency and ERC20 tokens. It extends functionality to enable NFT sales for stablecoins or other tokens using Chainlink oracles for price feeds.

## Project Overview

The main components of this project are:

1. MultiTokenWallet: A wallet contract supporting multiple tokens and NFT sales.
2. PriceConsumer: A contract to fetch real-time token prices from Chainlink oracles.
3. MockAggregator: A mock implementation of Chainlink's price feed for testing.
4. CustomToken: A basic ERC20 token for testing purposes.

## Key Features

- Deposit and withdraw multiple token types
- Convert between different currencies (ETH, USD, EUR, BTC)
- Support for NFT sales using various tokens
- Real-time price feeds using Chainlink oracles
- Gas price optimization
- Batch token deposits
- Token swapping functionality

## Contracts

1. `MultiTokenWallet.sol`: Main wallet contract with multi-token support and NFT sale functionality.
2. `PriceConsumer.sol`: Contract to interact with Chainlink price feeds.
3. `MockAggregator.sol`: Mock implementation of Chainlink's V3 Aggregator for testing.
4. `CustomToken.sol`: Sample ERC20 token for testing.

## Testing

The project includes comprehensive tests (`MultiWallet.test.js`) covering various scenarios such as:
- Token deposits and withdrawals
- Currency conversions
- NFT price calculations
- Gas price optimizations
- Token swapping

## Chainlink Oracle Integration

The project uses Chainlink oracles for real-time price feeds. It supports the following price pairs:
- ETH/USD
- Token/ETH
- EUR/USD
- BTC/ETH
- BTC/USD
- Gas price


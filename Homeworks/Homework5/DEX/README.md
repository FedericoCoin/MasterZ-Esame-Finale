# Decentralized Exchange (DEX) Project

This project implements a simple Decentralized Exchange (DEX) for swapping between Ether and a custom ERC20 token called CryptoDevToken.

## Features

- Liquidity provision and removal
- Token swapping (ETH <-> CryptoDevToken)
- Automated market maker functionality
- 0.3% fee on swaps
- Price calculation for tokens and ETH

## Contracts

1. `DEX.sol`: Main DEX contract implementing liquidity and swap functions
2. `CryptoDevToken.sol`: ERC20 token contract for the custom token

## Testing

The project includes comprehensive tests covering various scenarios such as:
- Liquidity addition and removal
- Token swapping
- Price calculations
- Edge cases and error handling


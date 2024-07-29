# Token Project

This project demonstrates a custom ERC20 token with additional blacklisting functionality. It includes contracts and tests to verify the core token operations and blacklisting features.

## Features

- **ERC20 Token**: Standard ERC20 token with minting and burning capabilities.
- **Blacklisting**: Allows the owner to add or remove addresses from a blacklist, preventing blacklisted addresses from transferring tokens.

## Contracts

### Token.sol

- **Mint Tokens**: Allows the owner to mint new tokens.
- **Burn Tokens**: Allows token holders to burn their tokens.
- **Blacklist/Whitelist Addresses**: Allows the owner to manage a blacklist of addresses that are restricted from transferring tokens.
- **Transfer Restrictions**: Prevents blacklisted addresses from transferring tokens.

## Deployment Script

### 1_deploy_contracts.js

- **Deployment**: Deploys the Token contract and mints an initial supply of tokens to the deployer's account.
- **Mint Initial Supply**: Mints 1,000,000 tokens to the deployer's account.

## Testing

### Token.test.js

- **Blacklist Functionality**: Tests for adding and removing addresses from the blacklist.
- **Transfer Restrictions**: Ensures blacklisted addresses cannot transfer tokens, while non-blacklisted addresses can.
- **Minting and Burning**: Verifies the minting and burning capabilities of the token.
- **Ownership Checks**: Ensures only the owner can perform sensitive operations like minting and managing the blacklist.
- **Token Properties**: Verifies the token's name and symbol.


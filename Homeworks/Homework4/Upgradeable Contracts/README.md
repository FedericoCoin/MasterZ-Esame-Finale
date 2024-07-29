# Upgradeable Smart Contracts Project

This project demonstrates the implementation, deployment, and upgrading of various smart contracts using the OpenZeppelin Upgrades plugin. It includes both Transparent Proxy and UUPS upgrade patterns.

## Project Overview

The project consists of the following main components:

1. Token Contract (Transparent Proxy Upgradeable)
2. Notarize Contract (Transparent Proxy Upgradeable)
3. ERC1155 Token Contract (UUPS Upgradeable)

## Contracts

### 1. Token Contract

- `Token.sol`: Initial version of the ERC20 token contract.
- `Token2.sol`: Upgraded version with additional features like max supply and blacklisting.

### 2. Notarize Contract

- `Notarize.sol`: Initial version of the document notarization contract.
- `Notarize2.sol`: Upgraded version with expiration dates and document revocation.

### 3. ERC1155 Token Contract

- `My1155Token.sol`: Initial version of the ERC1155 token contract.
- `My1155Token2.sol`: Upgraded version with minting, burning, and royalty features.


## Deployment Scripts

- `deployToken.js`: Script to deploy and upgrade the Token contract
- `deployNotarize.js`: Script to deploy and upgrade the Notarize contract
- `deploy1155Token.js`: Script to deploy and upgrade the ERC1155 token contract


## Upgrade contracts:
- Set `IS_UPGRADE=true` in your `.env` file
- Run the deployment scripts again

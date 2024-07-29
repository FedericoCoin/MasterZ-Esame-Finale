// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;


import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title Custom ERC20 Token
 * @dev Implementation of the ERC20 Token with Ownable functionality.
 */
contract CustomToken is ERC20, Ownable {
    /**
     * @notice Constructor to initialize the token with name, symbol, and initial supply.
     * @param tokenName Name of the token.
     * @param tokenSymbol Symbol of the token.
     * @param initialSupply Initial supply of the token, in smallest units (wei).
     */
    constructor(
        string memory tokenName,
        string memory tokenSymbol,
        uint256 initialSupply
    ) ERC20(tokenName, tokenSymbol) {
        // Mint the initial supply of tokens to the contract deployer's address.
        _mint(msg.sender, initialSupply * (10 ** decimals()));
    }

    function mint(address to, uint256 amount) public onlyOwner {
    _mint(to, amount);
}

function burn(uint256 amount) public {
    _burn(msg.sender, amount);
}
}

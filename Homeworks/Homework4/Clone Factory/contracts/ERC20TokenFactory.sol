// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./ERC20Token.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/proxy/Clones.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

contract ERC20TokenFactory is Ownable {
    using EnumerableSet for EnumerableSet.AddressSet;
    using Clones for address;

    address public immutable tokenImplementation;
    EnumerableSet.AddressSet private _deployedTokens;

    event TokenDeployed(address indexed tokenAddress, string name, string symbol, uint256 initialSupply, address indexed owner);

    constructor() {
        tokenImplementation = address(new ERC20Token());
    }

    function deployToken(
        string memory name,
        string memory symbol,
        uint256 initialSupply,
        address owner
    ) external onlyOwner returns (address) {
        address clone = tokenImplementation.clone();
        ERC20Token(clone).initialize(name, symbol, initialSupply, owner);
        _deployedTokens.add(clone);
        emit TokenDeployed(clone, name, symbol, initialSupply, owner);
        return clone;
    }

    function getDeployedTokens() external view returns (address[] memory) {
        return _deployedTokens.values();
    }

    function getDeployedTokensCount() external view returns (uint256) {
        return _deployedTokens.length();
    }

    function isTokenDeployed(address token) external view returns (bool) {
        return _deployedTokens.contains(token);
    }
}
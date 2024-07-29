// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";


contract Token is ERC20Upgradeable, OwnableUpgradeable, PausableUpgradeable {
    uint8 private VERSION;
    string private _customName;
    string private _customSymbol;

    function initialize(string memory _tokenName, string memory _tokenSymbol, uint256 _supply) public initializer {
    __ERC20_init(_tokenName, _tokenSymbol);
    __Ownable_init();
    __Pausable_init();
    _customName = _tokenName;
    _customSymbol = _tokenSymbol;
    _mint(msg.sender, _supply);
    VERSION = 1;
}

    function getContractVersion() external view returns (uint8) {
        return VERSION;
    }

    function name() public view override returns (string memory) {
        return _customName;
    }

    function symbol() public view override returns (string memory) {
        return _customSymbol;
    }

}



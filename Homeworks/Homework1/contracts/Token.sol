// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";


contract BlackList is Ownable {
    mapping(address => bool) public isBlackListed;

    event Blacklisted(address indexed account);
    event Whitelisted(address indexed account);

    function getBlackListStatus(address _maker) external view returns (bool) {
        return isBlackListed[_maker];
    }

   function addBlackList(address _evilUser) public onlyOwner {
    if (!isBlackListed[_evilUser]) {
        isBlackListed[_evilUser] = true;
        emit Blacklisted(_evilUser);
    }
}

function removeBlackList(address _clearedUser) public onlyOwner {
    if (isBlackListed[_clearedUser]) {
        isBlackListed[_clearedUser] = false;
        emit Whitelisted(_clearedUser);
    }
}
}

contract Token is ERC20, Ownable, BlackList {
 
    constructor(string memory tokenName, string memory tokenSym) ERC20(tokenName, tokenSym) { }

    function mint(address account, uint256 amount) external onlyOwner {
        _mint(account, amount);
    }


    function burn(uint256 amount) external {
        _burn(msg.sender, amount);
    }

    function _beforeTokenTransfer(address from, address to, uint256 amount) internal override {
        require(!isBlackListed[from], "Sender is blacklisted");
        super._beforeTokenTransfer(from, to, amount); // Call parent hook
    }
}

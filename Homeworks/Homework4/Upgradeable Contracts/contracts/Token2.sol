// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";


contract Token2 is Initializable, ERC20Upgradeable, OwnableUpgradeable, PausableUpgradeable {
    // Original storage layout
    uint8 private VERSION;
    string private _customName;
    string private _customSymbol;

    // New storage variables
    uint256 public maxSupply;
    mapping(address => bool) public isBlackListed;

    event Blacklisted(address indexed account);
    event Whitelisted(address indexed account);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(string memory _tokenName, string memory _tokenSymbol, uint256 _supply) public reinitializer(2) {
        __ERC20_init(_tokenName, _tokenSymbol);
        __Ownable_init();
        __Pausable_init();
        _customName = _tokenName;
        _customSymbol = _tokenSymbol;
        maxSupply = _supply;
        VERSION = 2;
    }

    function setMaxSupply(uint256 _max) external onlyOwner {
        require(_max >= totalSupply(), "max supply less than total supply");
        maxSupply = _max;
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    function burn(uint256 amount) external {
        _burn(msg.sender, amount);
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

    function getBlackListStatus(address _account) external view returns (bool) {
        return isBlackListed[_account];
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

    function _beforeTokenTransfer(address from, address to, uint256 amount) internal override whenNotPaused {
        require(!isBlackListed[from], "Sender is blacklisted");
        super._beforeTokenTransfer(from, to, amount);
    }
}
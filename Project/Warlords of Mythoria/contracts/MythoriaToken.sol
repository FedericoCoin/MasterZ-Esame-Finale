// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC20CappedUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC20BurnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
/**
 * @title MythoriaToken
 * @dev ERC20 Token of Mythoria marketplace with upgradeable and capped functionality
 */
contract MythoriaToken is 
    Initializable, 
    ERC20Upgradeable, 
    ERC20CappedUpgradeable,
    AccessControlUpgradeable, 
    PausableUpgradeable, 
    ERC20BurnableUpgradeable,
    OwnableUpgradeable
{
    uint256 public constant INITIAL_SUPPLY = 1_000_000_000 * 10**18; // 1 billion tokens
    uint256 public constant MAX_SUPPLY = 10_000_000_000 * 10**18; // 10 billion tokens

    mapping(address => bool) private _blacklist;

    event Blacklisted(address indexed account);
    event Whitelisted(address indexed account);

    /// @notice Initializes the contract with initial supply and sets up roles
    /// @param owner Address of the contract owner
    function initialize(address owner) public initializer {
        __ERC20_init("Mythoria Token", "MT");
        __ERC20Capped_init(MAX_SUPPLY);
        __AccessControl_init();
        __Pausable_init();
        __ERC20Burnable_init();
        __Ownable_init();

        _transferOwnership(owner);
        _mint(owner, INITIAL_SUPPLY);
    }

    /// @notice Mints new tokens
    /// @param account Address to receive the tokens
    /// @param amount Amount of tokens to mint
    function mint(address account, uint256 amount) public onlyOwner {
    _mint(account, amount);
}

/// @notice Pauses all token transfers
function pause() public onlyOwner {
    _pause();
}

/// @notice Unpauses all token transfers
function unpause() public onlyOwner {
    _unpause();
}
    /// @notice Adds an address to the blacklist
    /// @param account Address to be blacklisted
    function blacklist(address account) public onlyOwner {
    require(!_blacklist[account], "Account is already blacklisted");
    _blacklist[account] = true;
    emit Blacklisted(account);
}

    /// @notice Removes an address from the blacklist
    /// @param account Address to be removed from the blacklist
function unblacklist(address account) public onlyOwner {
    require(_blacklist[account], "Account is not blacklisted");
    _blacklist[account] = false;
    emit Whitelisted(account);
}


    /// @notice Checks if an address is blacklisted
    /// @param account Address to check
    /// @return bool True if the address is blacklisted, false otherwise
    function isBlacklisted(address account) public view returns (bool) {
        return _blacklist[account];
    }

    /// @dev Hook that is called before any transfer of tokens
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal override whenNotPaused {
        require(!_blacklist[from] && !_blacklist[to], "Blacklisted address");
        super._beforeTokenTransfer(from, to, amount);
    }

   /// @dev Override required due to multiple inheritance
    function _mint(address account, uint256 amount) internal override(ERC20Upgradeable, ERC20CappedUpgradeable) {
        super._mint(account, amount);
    }
}
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title Safe
 * @dev A contract to act as a safe storage for Ether and tokens.
 */
contract Safe is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    event EtherDeposited(address indexed sender, uint256 amount);
    event EtherWithdrawn(address indexed recipient, uint256 amount);
    event TokensDeposited(address indexed token, address indexed sender, uint256 amount);
    event TokensWithdrawn(address indexed token, address indexed recipient, uint256 amount);

    receive() external payable {
    emit EtherDeposited(msg.sender, msg.value);
}

    function depositTokens(address token, uint256 amount) external onlyOwner {
        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
        emit TokensDeposited(token, msg.sender, amount);
    }

    function depositEther() external payable onlyOwner {
        emit EtherDeposited(msg.sender, msg.value);
    }

   function withdrawTokens(address _token, uint256 amount, address recipient) external onlyOwner {
    IERC20(_token).safeTransfer(recipient, amount);
    emit TokensWithdrawn(_token, recipient, amount);
}

    function withdrawEther(uint256 amount, address payable recipient) external onlyOwner nonReentrant {
        require(address(this).balance >= amount, "Not enough Ether in safe");
        recipient.transfer(amount);
        emit EtherWithdrawn(recipient, amount);
    }

    function emergencyTransfer(address token, uint256 amount, address recipient) external onlyOwner nonReentrant {
        if (token == address(0)) {
            payable(recipient).transfer(amount);
            emit EtherWithdrawn(recipient, amount);
        } else {
            IERC20(token).safeTransfer(recipient, amount);
            emit TokensWithdrawn(token, recipient, amount);
        }
    }
}

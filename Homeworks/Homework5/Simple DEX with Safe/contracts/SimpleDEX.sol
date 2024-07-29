// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "./PriceConsumer.sol";
import "./Safe.sol";
import "hardhat/console.sol";
/**
 * @title SimpleDEX
 * @dev A simple decentralized exchange (DEX) contract for buying and selling ERC20 tokens using Ether.
 */
contract SimpleDEX is Ownable, Pausable {
    address public token;
    PriceConsumerV3 public ethUsdContract;
    Safe public safe;
    uint256 public ethPriceDecimals;
    uint256 public ethPrice;

    event Bought(uint256 amount);
    event Sold(uint256 amount);

    constructor(address _token, address _oracleEthUsdPrice, address payable _safe) {
        token = _token;
        ethUsdContract = PriceConsumerV3(_oracleEthUsdPrice);
        safe = Safe(_safe);
        ethPriceDecimals = ethUsdContract.getPriceDecimals();
    }

    receive() external payable whenNotPaused {}

  function buyToken() payable public whenNotPaused {
    uint256 amountToBuy = msg.value;
    require(amountToBuy > 0, "You need to send some ether");

    ethPrice = uint256(ethUsdContract.getLatestPrice());
    // Adjust the calculation to get the correct token amount
    uint256 amountToSend = amountToBuy * ethPrice / (10 ** ethPriceDecimals);
    
    console.log("Amount to send:", amountToSend);

    safe.withdrawTokens(token, amountToSend, msg.sender);
    
    // Transfer Ether to the Safe
    (bool success, ) = address(safe).call{value: msg.value}("");
    require(success, "Failed to send Ether to Safe");

    emit Bought(amountToSend);
}

    function sellToken(uint256 amount) public whenNotPaused {
        require(amount > 0, "You need to sell at least some tokens");

        uint256 allowance = IERC20(token).allowance(msg.sender, address(this));
        require(allowance >= amount, "Check the token allowance");

        ethPrice = uint256(ethUsdContract.getLatestPrice());
        uint256 amountToSend = amount * (10 ** ethPriceDecimals) / ethPrice;

        SafeERC20.safeTransferFrom(IERC20(token), msg.sender, address(safe), amount);
        safe.withdrawEther(amountToSend, payable(msg.sender));
        emit Sold(amount);
    }

    function emergencyTransfer(address _token, uint256 amount, address recipient) external onlyOwner {
        safe.emergencyTransfer(_token, amount, recipient);
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }
}

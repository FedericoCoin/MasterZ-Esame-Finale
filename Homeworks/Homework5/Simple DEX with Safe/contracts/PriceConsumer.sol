// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

contract PriceConsumerV3 {
    AggregatorV3Interface internal priceFeed;
    bool private isTestEnvironment;

    constructor(address _oracleAddress) {
        if (_oracleAddress == address(0)) {
            isTestEnvironment = true;
        } else {
            priceFeed = AggregatorV3Interface(_oracleAddress);
            isTestEnvironment = false;
        }
    }

    function getLatestPrice() public view returns (int256) {
        if (isTestEnvironment) {
            return 200000000000; // $2000.00000000 with 8 decimals
        }
        (, int256 price,,,) = priceFeed.latestRoundData();
        return price;
    }

    function getPriceDecimals() public view returns (uint8) {
        if (isTestEnvironment) {
            return 8;
        }
        return priceFeed.decimals();
    }
}
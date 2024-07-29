// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

// Importing Chainlink's AggregatorV3Interface to interact with price feeds.
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

/**
 * @title Price Consumer V3
 * @dev A contract to interact with Chainlink price feeds.
 */
contract PriceConsumerV3 {
    AggregatorV3Interface internal priceFeed;

    /**
     * @notice Constructor to initialize the price feed.
     * @param oracleAddress Address of the Chainlink price feed oracle.
     */
    constructor(address oracleAddress) {
        require(oracleAddress != address(0), "Invalid oracle address");
        priceFeed = AggregatorV3Interface(oracleAddress);
    }

    /**
     * @notice Fetches the latest price from the oracle.
     * @return int Latest price.
     */
    function getLatestPrice() public view returns (int) {
        (
            uint80 roundID,
            int price,
            uint256 startedAt,
            uint256 timeStamp,
            uint80 answeredInRound
        ) = priceFeed.latestRoundData();
        require(price > 0, "Invalid price data");
        require(timeStamp > 0, "Invalid timestamp");
        require(answeredInRound >= roundID, "Stale price data");
        return price;
    }

    /**
     * @notice Fetches the number of decimals used by the price feed.
     * @return uint Number of decimals.
     */
    function getPriceDecimals() public view returns (uint) {
        uint decimals = priceFeed.decimals();
        require(decimals > 0, "Invalid decimals");
        return decimals;
    }

    function getPriceDescription() public view returns (string memory) {
    return priceFeed.description();
}
}

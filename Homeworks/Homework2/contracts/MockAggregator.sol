// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/// @title MockV3Aggregator
/// @notice This contract is a mock version of the Chainlink V3 Aggregator for testing purposes.
/// @dev This contract provides a way to simulate price feeds in a testing environment.
contract MockV3Aggregator {
    /// @notice Number of decimals the aggregator uses.
    /// @dev Represents the number of decimal places for the price feed.
    uint8 public decimals;

    /// @notice The latest answer provided by the aggregator.
    /// @dev This is the latest price or value provided by the mock aggregator.
    int256 public latestAnswer;

    /// @notice Constructor to initialize the mock aggregator.
    /// @param _decimals The number of decimals for the price feed.
    /// @param _initialAnswer The initial price or value for the mock aggregator.
    constructor(uint8 _decimals, int256 _initialAnswer) {
        decimals = _decimals;
        latestAnswer = _initialAnswer;
    }

    /// @notice Gets the latest round data.
    /// @dev This function simulates the response from a Chainlink V3 Aggregator.
    /// @return roundId The round ID (mock value is 0).
    /// @return answer The latest answer (price or value).
    /// @return startedAt The timestamp when the round started (mock value is the current block timestamp).
    /// @return updatedAt The timestamp when the round was last updated (mock value is the current block timestamp).
    /// @return answeredInRound The round ID in which the answer was computed (mock value is 0).
    function latestRoundData()
        external
        view
        returns (
            uint80 roundId,
            int256 answer,
            uint256 startedAt,
            uint256 updatedAt,
            uint80 answeredInRound
        )
    {
        return (
            uint80(0),          // roundId
            latestAnswer,       // answer
            block.timestamp,    // startedAt
            block.timestamp,    // updatedAt
            uint80(0)           // answeredInRound
        );
    }

    function updateAnswer(int256 _answer) public {
    latestAnswer = _answer;
}
}

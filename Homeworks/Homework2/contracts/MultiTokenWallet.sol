// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import "./PriceConsumer.sol";

contract MultiTokenWallet is Ownable {
    using SafeERC20 for IERC20;

    function getTokenDecimals(address token) public view returns (uint8) {
    return IERC20Metadata(token).decimals();
}

    address public immutable ethUsdOracle;
    address public immutable tokenEthOracle;
    address public immutable eurUsdOracle;
    address public immutable btcEthOracle;
    address public immutable btcUsdOracle;
    address public immutable gasOracle;

    PriceConsumerV3 public ethUsdPriceFeed;
    PriceConsumerV3 public tokenEthPriceFeed;
    PriceConsumerV3 public eurUsdPriceFeed;
    PriceConsumerV3 public btcEthPriceFeed;
    PriceConsumerV3 public btcUsdPriceFeed;
    PriceConsumerV3 public gasPriceFeed;

    mapping(address => uint256) public userEthDeposits;
    mapping(address => mapping(address => uint256)) public userTokenDeposits;

    event TokenSwap(address indexed user, address fromToken, address toToken, uint256 fromAmount, uint256 toAmount);
    event Deposit(address indexed user, address indexed token, uint256 amount);
    event Withdrawal(address indexed user, address indexed token, uint256 amount);

    constructor(
        address ethUsdOracleAddress,
        address tokenEthOracleAddress,
        address eurUsdOracleAddress,
        address btcEthOracleAddress,
        address btcUsdOracleAddress,
        address gasOracleAddress
    ) {
        ethUsdOracle = ethUsdOracleAddress;
        tokenEthOracle = tokenEthOracleAddress;
        eurUsdOracle = eurUsdOracleAddress;
        btcEthOracle = btcEthOracleAddress;
        btcUsdOracle = btcUsdOracleAddress;
        gasOracle = gasOracleAddress;

        ethUsdPriceFeed = new PriceConsumerV3(ethUsdOracle);
        tokenEthPriceFeed = new PriceConsumerV3(tokenEthOracle);
        eurUsdPriceFeed = new PriceConsumerV3(eurUsdOracle);
        btcEthPriceFeed = new PriceConsumerV3(btcEthOracle);
        btcUsdPriceFeed = new PriceConsumerV3(btcUsdOracle);
        gasPriceFeed = new PriceConsumerV3(gasOracle);
    }
    /**
     * @notice Receive function to handle incoming ETH deposits.
     * @dev Only the owner can send ETH to this contract.
     */
    receive() external payable onlyOwner {
    _registerUserDeposit(msg.sender, msg.value);
    emit Deposit(msg.sender, address(0), msg.value); // address(0) represents ETH
}

    /**
     * @notice Internal function to register ETH deposits.
     * @param user Address of the user making the deposit.
     * @param amount Amount of ETH deposited.
     */
    function _registerUserDeposit(address user, uint256 amount) internal {
        userEthDeposits[user] += amount;
    }

   function convertEthToUsd(uint256 ethAmount) public view returns (uint256) {
    uint256 ethPrice = uint256(ethUsdPriceFeed.getLatestPrice());
    uint256 ethDecimals = 18;
    uint256 usdDecimals = 2; // Assuming 2 decimals for USD
    uint256 priceDecimals = ethUsdPriceFeed.getPriceDecimals();
    
    return (ethAmount * ethPrice * (10**usdDecimals)) / (10**(ethDecimals + priceDecimals));
}

function convertUsdToEth(uint256 usdAmount) public view returns (uint256) {
    uint256 ethPrice = uint256(ethUsdPriceFeed.getLatestPrice());
    require(ethPrice > 0, "Invalid ETH price");
    
    uint256 ethDecimals = 18;
    uint256 usdDecimals = 2; // Assuming 2 decimals for USD
    uint256 priceDecimals = ethUsdPriceFeed.getPriceDecimals();
    
    // Adjust the calculation to prevent overflow and maintain precision
    uint256 ethAmount = (usdAmount * (10**ethDecimals)) / (ethPrice / (10**(priceDecimals - usdDecimals)));
    
    return ethAmount;
}
    /**
     * @notice Converts a given token amount to its ETH equivalent.
     * @param token Address of the token.
     * @param tokenAmount The amount of tokens to be converted.
     * @return ethAmount The ETH equivalent of the given token amount.
     */
    function convertTokenToEth(address token, uint256 tokenAmount) public view returns (uint256) {
        uint256 tokenPrice = uint256(tokenEthPriceFeed.getLatestPrice());
        require(tokenPrice > 0, "Invalid token price data");
        uint256 ethAmount = (tokenAmount * tokenPrice) / (10 ** tokenEthPriceFeed.getPriceDecimals());
        return ethAmount;
    }

    /**
     * @notice Converts the price of an NFT in ETH to its USD equivalent.
     * @return nftPriceInUsd The USD equivalent of the NFT price in ETH.
     */
   function convertNFTPriceInUSD() public view returns (uint256) {
    uint256 nftPriceInEth = uint256(tokenEthPriceFeed.getLatestPrice());
    uint256 ethPriceInUsd = uint256(ethUsdPriceFeed.getLatestPrice());
    require(nftPriceInEth > 0 && ethPriceInUsd > 0, "Invalid price data");
    uint256 nftPriceInUsd = (nftPriceInEth * ethPriceInUsd) / (10 ** (tokenEthPriceFeed.getPriceDecimals() + ethUsdPriceFeed.getPriceDecimals() - 2)); // Assuming 2 decimals for USD
    return nftPriceInUsd;
}

    /**
     * @notice Converts a given USD amount to its NFT equivalent.
     * @param usdAmount The amount in USD to be converted.
     * @return nftAmount The NFT equivalent of the given USD amount.
     * @return remainingUsd The remaining USD after conversion.
     */
   function convertUSDInNFTAmount(uint256 usdAmount) public view returns (uint256 nftAmount, uint256 remainingUsd) {
    uint256 nftPriceInEth = uint256(tokenEthPriceFeed.getLatestPrice());
    uint256 ethPriceInUsd = uint256(ethUsdPriceFeed.getLatestPrice());
    require(nftPriceInEth > 0 && ethPriceInUsd > 0, "Invalid price data");
    
    uint256 nftPriceInUsd = (nftPriceInEth * ethPriceInUsd) / (10 ** (tokenEthPriceFeed.getPriceDecimals() + ethUsdPriceFeed.getPriceDecimals() - 2)); // Assuming 2 decimals for USD
    
    nftAmount = usdAmount / nftPriceInUsd;
    remainingUsd = usdAmount % nftPriceInUsd;
    return (nftAmount, remainingUsd);
}

    /**
     * @notice Withdraws a specified amount of ETH from the contract.
     * @param amount The amount of ETH to withdraw.
     */
    function withdrawEth(uint256 amount) external onlyOwner {
    require(address(this).balance >= amount, "MultiTokenWallet: Insufficient ETH balance for withdrawal");
    payable(owner()).transfer(amount);
    emit Withdrawal(owner(), address(0), amount); // address(0) represents ETH
}

    /**
     * @notice Withdraws a specified amount of a given token from the contract.
     * @param token Address of the token to withdraw.
     * @param amount The amount of the token to withdraw.
     */
   function withdrawTokens(address token, uint256 amount) external onlyOwner {
    uint256 balance = IERC20(token).balanceOf(address(this));
    require(balance >= amount, "MultiTokenWallet: Insufficient token balance for withdrawal");
    IERC20(token).safeTransfer(owner(), amount);
    emit Withdrawal(owner(), token, amount);
}

    /**
     * @notice Gets the token deposit of a user for a specified token.
     * @param user Address of the user.
     * @param token Address of the token.
     * @return The amount of the token deposited by the user.
     */
    function getUserTokenDeposit(address user, address token) public view returns (uint256) {
        return userTokenDeposits[user][token];
    }

    /**
     * @notice Allows a user to deposit a specified amount of a token.
     * @param token Address of the token to deposit.
     * @param amount The amount of the token to deposit.
     */
    function userTokenDeposit(address token, uint256 amount) public {
    IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
    userTokenDeposits[msg.sender][token] += amount;
    emit Deposit(msg.sender, token, amount);
}
    function batchDeposit(address[] memory tokens, uint256[] memory amounts) public {
    require(tokens.length == amounts.length, "MultiTokenWallet: Tokens and amounts length mismatch");
    for (uint i = 0; i < tokens.length; i++) {
        userTokenDeposit(tokens[i], amounts[i]);
    }
}

      function convertEurToUsd(uint256 eurAmount) public view returns (uint256) {
        uint256 eurUsdPrice = uint256(eurUsdPriceFeed.getLatestPrice());
        require(eurUsdPrice > 0, "Invalid EUR/USD price data");
        return (eurAmount * eurUsdPrice) / (10 ** eurUsdPriceFeed.getPriceDecimals());
    }

    function convertBtcToEth(uint256 btcAmount) public view returns (uint256) {
        uint256 btcEthPrice = uint256(btcEthPriceFeed.getLatestPrice());
        require(btcEthPrice > 0, "Invalid BTC/ETH price data");
        return (btcAmount * btcEthPrice) / (10 ** btcEthPriceFeed.getPriceDecimals());
    }

    function convertBtcToUsd(uint256 btcAmount) public view returns (uint256) {
        uint256 btcUsdPrice = uint256(btcUsdPriceFeed.getLatestPrice());
        require(btcUsdPrice > 0, "Invalid BTC/USD price data");
        return (btcAmount * btcUsdPrice) / (10 ** btcUsdPriceFeed.getPriceDecimals());
    }

    // Token swapping function

    function swapTokens(address fromToken, address toToken, uint256 fromAmount, uint256 minReceived) public {
    require(fromToken != toToken, "Cannot swap the same token");
    require(userTokenDeposits[msg.sender][fromToken] >= fromAmount, "Insufficient balance");

    uint256 fromTokenInEth = convertTokenToEth(fromToken, fromAmount);
    uint256 toTokenInEth = convertTokenToEth(toToken, 1e18); // 1 token of toToken in ETH
    uint256 toAmount = (fromTokenInEth * 1e18) / toTokenInEth;

    require(toAmount >= minReceived, "Slippage too high");

    userTokenDeposits[msg.sender][fromToken] -= fromAmount;
    userTokenDeposits[msg.sender][toToken] += toAmount;

    emit TokenSwap(msg.sender, fromToken, toToken, fromAmount, toAmount);
}
    // Gas price optimization function

    uint256 private constant GAS_PRICE_HISTORY_LENGTH = 10;
uint256[GAS_PRICE_HISTORY_LENGTH] private gasPriceHistory;
uint256 private gasPriceHistoryIndex;

function getOptimalGasPrice() public view returns (uint256) {
    uint256 gasPrice = uint256(gasPriceFeed.getLatestPrice());
    require(gasPrice > 0, "Invalid gas price data");
    return gasPrice;
}

function updateGasPriceHistory() public {
    uint256 currentGasPrice = getOptimalGasPrice();
    gasPriceHistory[gasPriceHistoryIndex] = currentGasPrice;
    gasPriceHistoryIndex = (gasPriceHistoryIndex + 1) % GAS_PRICE_HISTORY_LENGTH;
}

function getAverageGasPrice() public view returns (uint256) {
    uint256 sum = 0;
    for (uint i = 0; i < GAS_PRICE_HISTORY_LENGTH; i++) {
        sum += gasPriceHistory[i];
    }
    return sum / GAS_PRICE_HISTORY_LENGTH;
}

function isGasPriceOptimal() public view returns (bool) {
    uint256 currentGasPrice = getOptimalGasPrice();
    uint256 averageGasPrice = getAverageGasPrice();
    return currentGasPrice <= averageGasPrice * 12 / 10; // Allow up to 20% above average
}
}


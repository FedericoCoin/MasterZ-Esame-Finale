// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

contract DEX is ERC20, ReentrancyGuard {
    using SafeMath for uint256;

    address public immutable cryptoDevTokenAddress;
    uint256 public constant MINIMUM_LIQUIDITY = 10**3;
    uint256 public constant FEE_PERCENT = 3; // 0.3% fee

    event LiquidityAdded(address indexed provider, uint256 ethAmount, uint256 tokenAmount, uint256 liquidity);
    event LiquidityRemoved(address indexed provider, uint256 ethAmount, uint256 tokenAmount, uint256 liquidity);
    event TokenSwap(address indexed user, uint256 inputAmount, uint256 outputAmount, bool ethToToken);

    constructor(address _cryptoDevToken) ERC20("CryptoDev LP Token", "CDLP") {
        require(_cryptoDevToken != address(0), "Invalid token address");
        cryptoDevTokenAddress = _cryptoDevToken;
    }

    // Returns the token balance of this contract
    function getReserve() public view returns (uint256) {
        return IERC20(cryptoDevTokenAddress).balanceOf(address(this));
    }

    // Adds liquidity to the exchange
    function addLiquidity(uint256 _tokenAmount) public payable nonReentrant returns (uint256) {
        uint256 liquidity;
        uint256 ethBalance = address(this).balance;
        uint256 tokenReserve = getReserve();
        IERC20 token = IERC20(cryptoDevTokenAddress);

        if (tokenReserve == 0) {
            // First liquidity provision
            token.transferFrom(msg.sender, address(this), _tokenAmount);
            liquidity = ethBalance.sub(MINIMUM_LIQUIDITY);
            _mint(address(1), MINIMUM_LIQUIDITY); // Lock the first MINIMUM_LIQUIDITY tokens
        } else {
            // Subsequent liquidity provision
            uint256 ethReserve = ethBalance.sub(msg.value);
            uint256 tokenAmount = (msg.value.mul(tokenReserve) / ethReserve).add(1);
            require(_tokenAmount >= tokenAmount, "Insufficient token amount");
            
            token.transferFrom(msg.sender, address(this), tokenAmount);
            liquidity = msg.value.mul(totalSupply()) / ethReserve;
        }

        _mint(msg.sender, liquidity);
        emit LiquidityAdded(msg.sender, msg.value, _tokenAmount, liquidity);
        return liquidity;
    }

    // Removes liquidity from the exchange
    function removeLiquidity(uint256 _amount) public nonReentrant returns (uint256, uint256) {
        require(_amount > 0, "Invalid amount");
        uint256 ethReserve = address(this).balance;
        uint256 _totalSupply = totalSupply();

        uint256 ethAmount = _amount.mul(ethReserve) / _totalSupply;
        uint256 tokenAmount = _amount.mul(getReserve()) / _totalSupply;

        _burn(msg.sender, _amount);
        payable(msg.sender).transfer(ethAmount);
        IERC20(cryptoDevTokenAddress).transfer(msg.sender, tokenAmount);

        emit LiquidityRemoved(msg.sender, ethAmount, tokenAmount, _amount);
        return (ethAmount, tokenAmount);
    }

    // Swaps ETH for tokens
    function swapEthForTokens(uint256 _minTokens) public payable nonReentrant {
        uint256 tokenReserve = getReserve();
        uint256 tokensBought = getOutputAmount(
            msg.value,
            address(this).balance.sub(msg.value),
            tokenReserve
        );

        require(tokensBought >= _minTokens, "Insufficient output amount");
        IERC20(cryptoDevTokenAddress).transfer(msg.sender, tokensBought);
        emit TokenSwap(msg.sender, msg.value, tokensBought, true);
    }

    // Swaps tokens for ETH
    function swapTokensForEth(uint256 _tokensSold, uint256 _minEth) public nonReentrant {
        uint256 tokenReserve = getReserve();
        uint256 ethBought = getOutputAmount(
            _tokensSold,
            tokenReserve,
            address(this).balance
        );

        require(ethBought >= _minEth, "Insufficient output amount");
        IERC20(cryptoDevTokenAddress).transferFrom(msg.sender, address(this), _tokensSold);
        payable(msg.sender).transfer(ethBought);
        emit TokenSwap(msg.sender, _tokensSold, ethBought, false);
    }

    // Calculates the output amount for a swap
    function getOutputAmount(
        uint256 inputAmount,
        uint256 inputReserve,
        uint256 outputReserve
    ) public pure returns (uint256) {
        require(inputReserve > 0 && outputReserve > 0, "Invalid reserves");
        uint256 inputAmountWithFee = inputAmount.mul(1000 - FEE_PERCENT);
        uint256 numerator = inputAmountWithFee.mul(outputReserve);
        uint256 denominator = inputReserve.mul(1000).add(inputAmountWithFee);
        return numerator / denominator;
    }

    // Calculates the price of tokens in ETH
    function getTokenPrice(uint256 tokenAmount) public view returns (uint256) {
        require(tokenAmount > 0, "Invalid token amount");
        uint256 tokenReserve = getReserve();
        uint256 ethReserve = address(this).balance;
        return tokenAmount.mul(ethReserve) / tokenReserve;
    }

    // Calculates the price of ETH in tokens
    function getEthPrice(uint256 ethAmount) public view returns (uint256) {
        require(ethAmount > 0, "Invalid ETH amount");
        uint256 tokenReserve = getReserve();
        uint256 ethReserve = address(this).balance;
        return ethAmount.mul(tokenReserve) / ethReserve;
    }

    // Fallback function to receive ETH
    receive() external payable {}
}
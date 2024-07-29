const { BN, constants, expectEvent, expectRevert, time } = require('@openzeppelin/test-helpers');
const { web3 } = require('@openzeppelin/test-helpers/src/setup');
const { ZERO_ADDRESS } = constants;

const { expect } = require('chai');

const CustomToken = artifacts.require('CustomToken');
const MultiTokenWallet = artifacts.require('MultiTokenWallet');
const PriceConsumerV3 = artifacts.require('PriceConsumerV3');
const MockV3Aggregator = artifacts.require('MockV3Aggregator');

const USE_MOCK_ORACLES = true; // Set to false to use real oracles

const fromWei = (x) => web3.utils.fromWei(x.toString());
const toWei = (x) => web3.utils.toWei(x.toString());
const fromWei18Dec = (x) => Number(x) / Math.pow(10, 18);
const toWei18Dec = (x) => Number(x) * Math.pow(10, 18);
const fromWei8Dec = (x) => Number(x) / Math.pow(10, 8);
const toWei8Dec = (x) => Number(x) * Math.pow(10, 8);
const fromWei2Dec = (x) => (Number(x) / Math.pow(10, 2)).toFixed(2);
const toWei2Dec = (x) => Number(x) * Math.pow(10, 2);

contract('MultiTokenWallet', function (accounts) {
  const [deployer, firstAccount, secondAccount, fakeOwner] = accounts;

  let tokenContract, walletContract, mockEthUsdPriceFeed, mockTokenEthPriceFeed, mockEurUsdPriceFeed, mockBtcEthPriceFeed, mockBtcUsdPriceFeed, mockGasPriceFeed;

  before(async function () {
    if (USE_MOCK_ORACLES) {
      // Deploy mock price feeds
      mockEthUsdPriceFeed = await MockV3Aggregator.new(8, 200000000000); // $2000 with 8 decimals
      mockTokenEthPriceFeed = await MockV3Aggregator.new(18, web3.utils.toWei('0.1', 'ether')); // 0.1 ETH
      mockEurUsdPriceFeed = await MockV3Aggregator.new(8, 120000000); // 1.20 USD
      mockBtcEthPriceFeed = await MockV3Aggregator.new(18, web3.utils.toWei('15', 'ether')); // 15 ETH
      mockBtcUsdPriceFeed = await MockV3Aggregator.new(8, 3000000000000); // $30,000
      mockGasPriceFeed = await MockV3Aggregator.new(8, 5000000000); // 50 Gwei
  
      tokenContract = await CustomToken.new("My Custom Token", "MCT", 1000000);
      walletContract = await MultiTokenWallet.new(
        mockEthUsdPriceFeed.address,
        mockTokenEthPriceFeed.address,
        mockEurUsdPriceFeed.address,
        mockBtcEthPriceFeed.address,
        mockBtcUsdPriceFeed.address,
        mockGasPriceFeed.address
      );
    } else {
      // Use real oracle addresses
      const ethUsdContract = "0x694AA1769357215DE4FAC081bf1f309aDC325306";
      const tokenEthContract = "0xAB894A477C31974D5B79BcE864F343455E1150";
      const eurUsdContract = "0x1a81afB8146aeFfCFc5E50e8479e826E7D55b910";
      const btcEthContract = "0x5fb1616F78dA7aFC9FF79e0371741a747D2a7F22";
      const btcUsdContract = "0x1b44F3514812d835EB1BDB0acB33d3fA3351Ee43";
      const gasOracleAddress = "0x169E633A2D1E6c10dD91238Ba11c4A708dfEF37C";
  
      tokenContract = await CustomToken.new("My Custom Token", "MCT", 1000000);
      walletContract = await MultiTokenWallet.new(
        ethUsdContract,
        tokenEthContract,
        eurUsdContract,
        btcEthContract,
        btcUsdContract,
        gasOracleAddress
      );
    }
  });

  it('retrieve deployed contracts', async function () {
    expect(tokenContract.address).to.be.not.equal(ZERO_ADDRESS);
    expect(walletContract.address).to.be.not.equal(ZERO_ADDRESS);
    expect(mockEthUsdPriceFeed.address).to.be.not.equal(ZERO_ADDRESS);
    expect(mockTokenEthPriceFeed.address).to.be.not.equal(ZERO_ADDRESS);
    console.log('Contracts deployed:', {
      token: tokenContract.address,
      wallet: walletContract.address,
      ethUsdPriceFeed: mockEthUsdPriceFeed.address,
      tokenEthPriceFeed: mockTokenEthPriceFeed.address
    });
  });

  it('distribute some tokens from deployer', async function () {
    await tokenContract.transfer(firstAccount, toWei(100000));
    await tokenContract.transfer(secondAccount, toWei(150000));

    const balDep = await tokenContract.balanceOf(deployer);
    const balFA = await tokenContract.balanceOf(firstAccount);
    const balSA = await tokenContract.balanceOf(secondAccount);

    console.log('Token balances after distribution:', {
      deployer: fromWei(balDep),
      firstAccount: fromWei(balFA),
      secondAccount: fromWei(balSA)
    });
  });

  it('ETH / USD price', async function () {
    const priceFeed = USE_MOCK_ORACLES ? mockEthUsdPriceFeed : await PriceConsumerV3.at(await walletContract.ethUsdPriceFeed());
    const decimals = await priceFeed.decimals();
    const price = USE_MOCK_ORACLES ? await priceFeed.latestAnswer() : await priceFeed.getLatestPrice();
    console.log('ETH/USD Price:', {
      decimals: decimals.toString(),
      price: fromWei8Dec(price)
    });
  });

  it('Token / ETH price', async function () {
    const decimals = await mockTokenEthPriceFeed.decimals();
    const price = await mockTokenEthPriceFeed.latestAnswer();
    console.log('Token/ETH Price:', {
      decimals: decimals.toString(),
      price: fromWei(price)
    });
  });

  it('convert ETH to USD and vice versa', async function () {
    try {
      console.log('Sending 2 ETH to the wallet...');
      await walletContract.sendTransaction({from: deployer, value: toWei(2)});
  
      console.log('Calling convertEthToUsd...');
      let usdDeposit = await walletContract.convertEthToUsd(toWei(2));
      console.log('2 ETH in USD:', fromWei2Dec(usdDeposit));
  
      console.log('Calling convertUsdToEth...');
      let ethAmount = await walletContract.convertUsdToEth(toWei2Dec(5000));
      console.log('5000 USD in ETH:', fromWei(ethAmount));
  
      // Add assertions
      expect(Number(fromWei2Dec(usdDeposit))).to.equal(4000);
      expect(Number(fromWei(ethAmount))).to.be.closeTo(2.5, 0.01); // Allow for small rounding differences
    } catch (error) {
      console.error('Error in convert ETH to USD test:', error.message);
      if (error.reason) console.error('Reason:', error.reason);
      if (error.data) console.error('Data:', error.data);
      throw error;
    }
  });

  it('convert Token to ETH', async function () {
    let ethAmount = await walletContract.convertTokenToEth(tokenContract.address, toWei(1000));
    console.log('1000 Tokens in ETH:', fromWei(ethAmount));
  });

  it('convert EUR to USD', async function () {
    let usdAmount = await walletContract.convertEurToUsd(toWei2Dec(1000));
    console.log('1000 EUR in USD:', fromWei2Dec(usdAmount));
  });

  it('convert BTC to ETH', async function () {
    let ethAmount = await walletContract.convertBtcToEth(toWei8Dec(1));
    console.log('1 BTC in ETH:', fromWei(ethAmount));
  });

  it('convert BTC to USD', async function () {
    let usdAmount = await walletContract.convertBtcToUsd(toWei8Dec(1));
    console.log('1 BTC in USD:', fromWei2Dec(usdAmount));
  });

  it('user deposits tokens', async function () {
    await tokenContract.approve(walletContract.address, toWei(25000), {from: firstAccount});
    await walletContract.userTokenDeposit(tokenContract.address, toWei(25000), {from: firstAccount});
    
    let deposit = await walletContract.getUserTokenDeposit(firstAccount, tokenContract.address);
    let contractBalance = await tokenContract.balanceOf(walletContract.address);
    
    console.log('After token deposit:', {
      userDeposit: fromWei(deposit),
      contractBalance: fromWei(contractBalance)
    });
  });

  it('batch deposit tokens', async function () {
    await tokenContract.approve(walletContract.address, toWei(50000), {from: secondAccount});
    await walletContract.batchDeposit([tokenContract.address], [toWei(50000)], {from: secondAccount});
    
    let deposit = await walletContract.getUserTokenDeposit(secondAccount, tokenContract.address);
    let contractBalance = await tokenContract.balanceOf(walletContract.address);
    
    console.log('After batch token deposit:', {
      userDeposit: fromWei(deposit),
      contractBalance: fromWei(contractBalance)
    });
  });

  it('swap tokens', async function () {
    const mockToken2 = await CustomToken.new("Second Token", "SCT", 1000000);
    await mockToken2.transfer(walletContract.address, toWei(100000));

    const initialBalance1 = await walletContract.getUserTokenDeposit(firstAccount, tokenContract.address);
    const initialBalance2 = await walletContract.getUserTokenDeposit(firstAccount, mockToken2.address);

    await walletContract.swapTokens(tokenContract.address, mockToken2.address, toWei(1000), toWei(90), {from: firstAccount});

    const finalBalance1 = await walletContract.getUserTokenDeposit(firstAccount, tokenContract.address);
    const finalBalance2 = await walletContract.getUserTokenDeposit(firstAccount, mockToken2.address);

    console.log('Token balances after swap:', {
      token1: {
        before: fromWei(initialBalance1),
        after: fromWei(finalBalance1)
      },
      token2: {
        before: fromWei(initialBalance2),
        after: fromWei(finalBalance2)
      }
    });
  });

  it('should reject ETH deposits from non-approved addresses', async function () {
    await expectRevert(
      walletContract.sendTransaction({ from: fakeOwner, value: toWei(1) }),
      "Ownable: caller is not the owner"
    );
  });

  it('should allow owner to withdraw ETH', async function () {
    const initialBalance = await web3.eth.getBalance(deployer);
    await walletContract.withdrawEth(toWei(1), { from: deployer });
    const finalBalance = await web3.eth.getBalance(deployer);
    
    console.log('ETH balance after withdrawal:', {
      before: fromWei(initialBalance),
      after: fromWei(finalBalance)
    });
    
    expect(new BN(finalBalance)).to.be.bignumber.greaterThan(new BN(initialBalance));
  });

  it('should allow owner to withdraw Tokens', async function () {
    const initialBalance = await tokenContract.balanceOf(deployer);
    await walletContract.withdrawTokens(tokenContract.address, toWei(5000), { from: deployer });
    const finalBalance = await tokenContract.balanceOf(deployer);
    
    console.log('Token balance after withdrawal:', {
      before: fromWei(initialBalance),
      after: fromWei(finalBalance)
    });
    
    expect(new BN(finalBalance)).to.be.bignumber.greaterThan(new BN(initialBalance));
  });

  it('should fail on withdrawing more tokens than available', async function () {
    await expectRevert(
      walletContract.withdrawTokens(tokenContract.address, toWei(1000000), { from: deployer }),
      "MultiTokenWallet: Insufficient token balance for withdrawal"
    );
  });

  it('should get optimal gas price', async function () {
    const gasPrice = await walletContract.getOptimalGasPrice();
    console.log('Optimal gas price:', fromWei8Dec(gasPrice));
  });

  it('should update gas price history', async function () {
    await walletContract.updateGasPriceHistory();
    const averageGasPrice = await walletContract.getAverageGasPrice();
    console.log('Average gas price:', fromWei8Dec(averageGasPrice));
  });

  it('should check if gas price is optimal', async function () {
    const isOptimal = await walletContract.isGasPriceOptimal();
    console.log('Is gas price optimal:', isOptimal);
  });
});
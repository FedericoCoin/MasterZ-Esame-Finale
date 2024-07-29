// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./MyNFTToken.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

contract MyNFTTokenFactory is Ownable {
    using EnumerableSet for EnumerableSet.AddressSet;

    EnumerableSet.AddressSet private _nftTokenContracts;
    
    event NFTTokenDeployed(address indexed tokenAddress, string name, string symbol, address indexed creator);
    event NFTTokenPaused(address indexed tokenAddress);
    event NFTTokenUnpaused(address indexed tokenAddress);

    error TokenNotDeployedByFactory(address tokenAddress);

    /**
     * @dev Deploy a new ERC721 token contract
     * @param collName collection name
     * @param collSym collection symbol
     * @param creator address of the creator
     * @return newNFTToken deployed NFT token address
     */
    function deployNewNFTToken(string memory collName, string memory collSym, address creator) external onlyOwner returns (address) {
        MyNFTToken newNFTToken = new MyNFTToken(collName, collSym);
        newNFTToken.transferOwnership(creator);
        _nftTokenContracts.add(address(newNFTToken));
        emit NFTTokenDeployed(address(newNFTToken), collName, collSym, creator);
        return address(newNFTToken);
    }

    /**
     * @dev Get NFT token address by index
     * @param index token array index
     * @return token address
     */
    function getNFTTokenAddress(uint256 index) external view returns (address) {
        return _nftTokenContracts.at(index);
    }

    /**
     * @dev Get total number of deployed NFT tokens
     * @return number of deployed token contracts
     */
    function getNFTTokenCount() external view returns (uint256) {
        return _nftTokenContracts.length();
    }

    /**
     * @dev Check if an address is a deployed NFT token
     * @param token address to check
     * @return bool indicating if the token was deployed by this factory
     */
    function isNFTTokenDeployed(address token) public view returns (bool) {
        return _nftTokenContracts.contains(token);
    }

    /**
     * @dev Pause an NFT contract
     * @param nftToBePaused address of the NFT contract to pause
     */
    function pauseNFTContract(address nftToBePaused) external onlyOwner {
        if (!isNFTTokenDeployed(nftToBePaused)) {
            revert TokenNotDeployedByFactory(nftToBePaused);
        }
        MyNFTToken(nftToBePaused).pause();
        emit NFTTokenPaused(nftToBePaused);
    }

    /**
     * @dev Unpause an NFT contract
     * @param nftToBeUnpaused address of the NFT contract to unpause
     */
    function unpauseNFTContract(address nftToBeUnpaused) external onlyOwner {
        if (!isNFTTokenDeployed(nftToBeUnpaused)) {
            revert TokenNotDeployedByFactory(nftToBeUnpaused);
        }
        MyNFTToken(nftToBeUnpaused).unpause();
        emit NFTTokenUnpaused(nftToBeUnpaused);
    }
}
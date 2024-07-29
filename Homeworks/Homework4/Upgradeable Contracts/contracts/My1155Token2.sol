// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./My1155Token.sol";

contract My1155Token2 is My1155Token {
    event TokensMinted(address indexed to, uint256 indexed id, uint256 amount);
    event TokensBurned(address indexed from, uint256 indexed id, uint256 amount);
    event URIUpdated(uint256 indexed id, string newUri);
    event RoyaltySet(uint256 indexed tokenId, address receiver, uint96 feeNumerator);

    function mint(address to, uint256 id, uint256 amount, bytes memory data) public onlyRole(MINTER_ROLE) {
        _mint(to, id, amount, data);
        emit TokensMinted(to, id, amount);
    }

    function mintBatch(address to, uint256[] memory ids, uint256[] memory amounts, bytes memory data) public onlyRole(MINTER_ROLE) {
        _mintBatch(to, ids, amounts, data);
        for (uint256 i = 0; i < ids.length; i++) {
            emit TokensMinted(to, ids[i], amounts[i]);
        }
    }

    function burn(address from, uint256 id, uint256 amount) public {
        require(from == _msgSender() || isApprovedForAll(from, _msgSender()), "ERC1155: caller is not owner nor approved");
        _burn(from, id, amount);
        emit TokensBurned(from, id, amount);
    }

    function burnBatch(address from, uint256[] memory ids, uint256[] memory amounts) public {
        require(from == _msgSender() || isApprovedForAll(from, _msgSender()), "ERC1155: caller is not owner nor approved");
        _burnBatch(from, ids, amounts);
        for (uint256 i = 0; i < ids.length; i++) {
            emit TokensBurned(from, ids[i], amounts[i]);
        }
    }

    function setURI(uint256 id, string memory newuri) public onlyRole(DEFAULT_ADMIN_ROLE) {
        _uris[id] = newuri;
        emit URIUpdated(id, newuri);
    }

    function setTokenRoyalty(uint256 tokenId, address receiver, uint96 feeNumerator) public onlyRole(DEFAULT_ADMIN_ROLE) {
        _setTokenRoyalty(tokenId, receiver, feeNumerator);
        emit RoyaltySet(tokenId, receiver, feeNumerator);
    }

    function safeBatchTransferFrom(
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory data
    ) public virtual override {
        require(from == _msgSender() || isApprovedForAll(from, _msgSender()), "ERC1155: transfer caller is not owner nor approved");
        _safeBatchTransferFrom(from, to, ids, amounts, data);
    }

    function pause() public onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }

    function unpause() public onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }
}
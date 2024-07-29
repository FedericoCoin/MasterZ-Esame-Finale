// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/CountersUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlEnumerableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";



contract Notarize is Initializable, OwnableUpgradeable, AccessControlEnumerableUpgradeable {
    using CountersUpgradeable for CountersUpgradeable.Counter;
    
    bytes32 public constant HASH_WRITER = keccak256("HASH_WRITER");

    CountersUpgradeable.Counter private _docCounter;
    mapping(uint256 => Doc) private _documents;
    mapping(bytes32 => bool) private _regHashes;

    uint8 private VERSION;

    event DocHashAdded(uint256 indexed docCounter, string docUrl, bytes32 docHash);

    struct Doc {
        string docUrl;
        bytes32 docHash;
    }
    
    uint8 private constant VERSION_SLOT = 0;

    function initialize() public initializer {
        __Ownable_init();
        __AccessControlEnumerable_init();
        _setupRole(DEFAULT_ADMIN_ROLE, _msgSender());
        VERSION = 1;
    }

     function getContractVersion() external view returns (uint8) {
        return VERSION;
    }
    
    function setHashWriterRole(address _hashWriter) external onlyRole(DEFAULT_ADMIN_ROLE) {
        grantRole(HASH_WRITER, _hashWriter);
    }

    function addNewDocument(string memory _url, bytes32 _hash) external onlyRole(HASH_WRITER) {
        require(!_regHashes[_hash], "Hash already notarized");
        uint256 counter = _docCounter.current();
        _documents[counter] = Doc(_url, _hash);
        _regHashes[_hash] = true;
        _docCounter.increment();
        emit DocHashAdded(counter, _url, _hash);
    }

    function getDocInfo(uint256 _num) external view returns (string memory, bytes32) {
        require(_num < _docCounter.current(), "Requested Number does not exist");
        return (_documents[_num].docUrl, _documents[_num].docHash);
    }

    function getDocsCount() external view returns (uint256) {
        return _docCounter.current();
    }

    function getRegisteredHash(bytes32 _hash) external view returns (bool) {
        return _regHashes[_hash];
    }
}
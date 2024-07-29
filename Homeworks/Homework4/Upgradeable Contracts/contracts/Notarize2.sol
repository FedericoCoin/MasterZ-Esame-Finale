// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/CountersUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlEnumerableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";




contract Notarize2 is Initializable, OwnableUpgradeable, AccessControlEnumerableUpgradeable {
    using CountersUpgradeable for CountersUpgradeable.Counter;
    
    
    bytes32 public constant HASH_WRITER = keccak256("HASH_WRITER");

    CountersUpgradeable.Counter private _docCounter;
    mapping(uint256 => Doc) private _documents;
    mapping(bytes32 => bool) private _regHashes;

    uint8 private VERSION;

    event DocHashAdded(uint256 indexed docCounter, string docUrl, bytes32 docHash, uint256 expirationDate);
    event DocExpirationExtended(uint256 indexed docCounter, uint256 newExpirationDate);
    event DocRevoked(uint256 indexed docCounter);

    struct Doc {
        string docUrl;
        bytes32 docHash;
        uint256 expirationDate;
        bool isRevoked;
    }
    
    uint8 private constant VERSION_SLOT = 0;

    function initialize() public reinitializer(2) {
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

    function addNewDocument(string memory _url, bytes32 _hash, uint256 _expirationDate) external onlyRole(HASH_WRITER) {
        require(!_regHashes[_hash], "Hash already notarized");
        require(_expirationDate > block.timestamp, "Expiration date must be in the future");
        
        uint256 counter = _docCounter.current();
        _documents[counter] = Doc(_url, _hash, _expirationDate, false);
        _regHashes[_hash] = true;
        _docCounter.increment();
        
        emit DocHashAdded(counter, _url, _hash, _expirationDate);
    }

    function extendExpirationDate(uint256 _docId, uint256 _newExpirationDate) external onlyRole(HASH_WRITER) {
        require(_docId < _docCounter.current(), "Document does not exist");
        require(!_documents[_docId].isRevoked, "Document is revoked");
        require(_newExpirationDate > _documents[_docId].expirationDate, "New expiration date must be later than current");
        
        _documents[_docId].expirationDate = _newExpirationDate;
        
        emit DocExpirationExtended(_docId, _newExpirationDate);
    }

    function revokeDocument(uint256 _docId) external onlyRole(HASH_WRITER) {
        require(_docId < _docCounter.current(), "Document does not exist");
        require(!_documents[_docId].isRevoked, "Document is already revoked");
        
        _documents[_docId].isRevoked = true;
        
        emit DocRevoked(_docId);
    }

    function getDocInfo(uint256 _num) external view returns (string memory, bytes32, uint256, bool) {
        require(_num < _docCounter.current(), "Requested Number does not exist");
        Doc memory doc = _documents[_num];
        return (doc.docUrl, doc.docHash, doc.expirationDate, doc.isRevoked);
    }

    function getDocsCount() external view returns (uint256) {
        return _docCounter.current();
    }

    function getRegisteredHash(bytes32 _hash) external view returns (bool) {
        return _regHashes[_hash];
    }
}
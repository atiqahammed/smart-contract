// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.16;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "@openzeppelin/contracts/utils/cryptography/draft-EIP712.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "./IPixelmon.sol";

/// @notice Thrown when the nonce is invalid for evolution.
error InvalidNonce();
/// @notice Thrown when the evolution data is invalid for the transaction.
error InvalidData();
/// @notice Thrown when the evolution token amount is not correct.
error InvalidAmount();
/// @notice Thrown when the input signature is invalid.
error InvalidSignature();
/// @notice Thrown when caller is not the owner of the Pixelmon NFT which is used for evolution.
error InvalidOwner();

/// @title Pixelmon Evolution
/// @author LiquidX
/// @notice This smart contract mint the evolve pixelmon for different stage.
contract PixelmonEvolution is Ownable, EIP712, ReentrancyGuard {
    /// @dev Burner Address for Serum token
    /// @notice After evolution the Serum token will be transferred to this burner address
    address public constant BURNER_ADDRESS = 0x000000000000000000000000000000000000dEaD;

    /// @dev Signing domain for the purpose of creating signature
    string public constant SIGNING_DOMAIN = "Pixelmon-Evolution";
    /// @dev signature version for creating and verifying signature
    string public constant SIGNATURE_VERSION = "1";

    /// @dev Pixelmon NFT smart contract
    IPixelmon public PIXELMON_CONTRACT;
    /// @dev Serum smart contract for evolution
    IERC1155 public SERUM_CONTRACT;
    /// @dev Signer wallet address for signature verification
    address public SIGNER;

    /// @notice List of nonce against user wallet for counting the total transaction for evolving pixelmon
    /// @dev Use this mapping to track the evolved transaction count
    /// @custom:key A valid ethereum address
    /// @custom:value the amount of evolved transaction
    mapping(address => uint256) public nonces;

    /// @notice There's a batch transaction for evolving pixelmon happening
    /// @dev Emit event when calling evolvePixelmon function
    /// @param pixelmonOwner Address who calls the function
    /// @param nonce The index of requests from a particular wallet
    /// @param pixelmonTokenIds Pixelmon NFT tokenId list
    /// @param serumTokenIds Serum tokenId list
    /// @param serumAmounts Serum token amount list
    /// @param evolutionStage Pixelmon evlution stage
    /// @param message String message to identify the event
    event PixelmonBatchEvolve(
        address pixelmonOwner,
        uint256 nonce,
        uint256[] pixelmonTokenIds,
        uint256[] serumTokenIds,
        uint256[] serumAmounts,
        uint256 evolutionStage,
        string message
    );

    ///@dev Modifier that blocks to call the method from any different smart contract
    modifier noContracts() {
        uint256 size;
        address acc = msg.sender;
        assembly {
            size := extcodesize(acc)
        }
        require(msg.sender == tx.origin, "tx.origin != msg.sender");
        require(size == 0, "Contract calls are not allowed");
        _;
    }

    /// @notice Sets Pixelmon, Serum and Signer address
    /// @param pixelmonAddress Pixelmon NFT contract
    /// @param serumAddress Serum token Contract
    /// @param signer Signer wallet address for signature verification
    constructor(
        address pixelmonAddress,
        address serumAddress,
        address signer
    ) EIP712(SIGNING_DOMAIN, SIGNATURE_VERSION) {
        PIXELMON_CONTRACT = IPixelmon(pixelmonAddress);
        SERUM_CONTRACT = IERC1155(serumAddress);
        SIGNER = signer;
    }

    /// @notice Sets Pixelmon NFT contract address
    /// @dev This function can only be executed by the contract owner
    /// @param pixelmonAddress Pixelmon NFT contract
    function setPixelmonAddress(address pixelmonAddress) external onlyOwner {
        PIXELMON_CONTRACT = IPixelmon(pixelmonAddress);
    }

    /// @notice Sets Serum token contract address
    /// @dev This function can only be executed by the contract owner
    /// @param serumAddress Serum token Contract
    function setSerumAddress(address serumAddress) external onlyOwner {
        SERUM_CONTRACT = IERC1155(serumAddress);
    }

    /// @notice Sets Signer wallet address
    /// @dev This function can only be executed by the contract owner
    /// @param signer Signer wallet address for signature verifition
    function setSignerAddress(address signer) external onlyOwner {
        SIGNER = signer;
    }

    /// @notice Returns the hash integer value from an array of integer
    /// @dev This is a view function and have no gas cost
    /// @param array array of integer
    function getHashIntFromArray(uint256[] memory array) public pure returns (uint256) {
        return uint256(keccak256(abi.encodePacked(array)));
    }

    /// @notice Burns Serum token and mint evolved Pixelmon token
    /// @dev Owner of Pixelmon token and Serum token can call with proper signature
    /// @param pixelmonTokenIds List of Pixelmon tokenId
    /// @param serumIds List of Serum token Id
    /// @param serumAmounts List of Serum token amount
    /// @param evolutionStage Evolution stage for minting evolve Pixelmon
    /// @param nonce Nonce for the transaction to evolve pixelmon
    /// @param signature Signature from signer wallet
    function evolvePixelmon(
        uint256[] memory pixelmonTokenIds,
        uint256[] memory serumIds,
        uint256[] memory serumAmounts,
        uint256 evolutionStage,
        uint256 nonce,
        bytes calldata signature
    ) external nonReentrant noContracts {
        if (serumIds.length != serumAmounts.length) {
            revert InvalidData();
        }

        uint256 totalEvolveAmount;
        for (uint256 index = 0; index < serumAmounts.length; index++) {
            totalEvolveAmount += serumAmounts[index];
        }

        if (totalEvolveAmount != pixelmonTokenIds.length) {
            revert InvalidAmount();
        }

        if (nonce != nonces[msg.sender]) {
            revert InvalidNonce();
        }
        unchecked {
            nonces[msg.sender]++;
        }

        address signer = recoverSignerFromSignature(pixelmonTokenIds, serumIds, serumAmounts, evolutionStage, nonce, msg.sender, signature);
        if (signer != SIGNER) {
            revert InvalidSignature();
        }

        SERUM_CONTRACT.safeBatchTransferFrom(msg.sender, BURNER_ADDRESS, serumIds, serumAmounts, "");

        for (uint256 index = 0; index < pixelmonTokenIds.length; index = _uncheckedInc(index)) {
            uint256 tokenId = pixelmonTokenIds[index];
            address tokenOwner = PIXELMON_CONTRACT.ownerOf(tokenId);
            if (tokenOwner != msg.sender) {
                revert InvalidOwner();
            }
            PIXELMON_CONTRACT.mintEvolvedPixelmon(msg.sender, evolutionStage);
        }

        emit PixelmonBatchEvolve(msg.sender, nonce, pixelmonTokenIds, serumIds, serumAmounts, evolutionStage, "pixelmon evolved");
    }

    /// @notice Recovers signer wallet from signature
    /// @dev View function for signature recovering
    /// @param pixelmonTokenIds List of Pixelmon tokenId
    /// @param serumIds List of Serum token Id
    /// @param serumAmounts List of Serum token amount
    /// @param evolutionStage Evolution stage for minting evolve Pixelmon
    /// @param nonce Nonce for transaction for evolving pixelmon
    /// @param tokenOwner Token owner wallet address
    /// @param signature Signature from signer wallet
    function recoverSignerFromSignature(
        uint256[] memory pixelmonTokenIds,
        uint256[] memory serumIds,
        uint256[] memory serumAmounts,
        uint256 evolutionStage,
        uint256 nonce,
        address tokenOwner,
        bytes calldata signature
    ) public view returns (address) {
        bytes32 digest = _hashTypedDataV4(
            keccak256(
                abi.encode(
                    keccak256(
                        "PixelmonEvolutionSignature(uint256 pixelmonTokenIds,uint256 serumIds,uint256 serumAmounts,uint256 evolutionStage,uint256 nonce,address tokenOwner)"
                    ),
                    getHashIntFromArray(pixelmonTokenIds),
                    getHashIntFromArray(serumIds),
                    getHashIntFromArray(serumAmounts),
                    evolutionStage,
                    nonce,
                    tokenOwner
                )
            )
        );
        return ECDSA.recover(digest, signature);
    }

    /// @dev Unchecked increment function, just to reduce gas usage
    /// @notice This value can not be greater than 1000
    /// @param value value to be incremented, should not overflow 2**256 - 1
    /// @return incremented value
    function _uncheckedInc(uint256 value) internal pure returns (uint256) {
        unchecked {
            return value + 1;
        }
    }
}
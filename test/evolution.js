const { expect } = require("chai");
const hre = require("hardhat");
const { deployContract, NOT_CURRENT_OWNER } = require("./utils");
require("dotenv").config();

describe("Pixelmon Evolution Contract Functionality", function () {
    let contractDeployerWallet;
    let anonymousUserWallet;
    let newContractOwnerWallet;
    let mockNFTContract;
    let mockFTContract;
    let contract;
    let signerWallet;

    beforeEach(async function () {
        const {
            deployer,
            anonymousWallet,
            newContractOwner,
            pixelmonEvolution,
            mockFT,
            mockNFT,
            signer
        } = await deployContract();

        contractDeployerWallet = deployer;
        anonymousUserWallet = anonymousWallet;
        newContractOwnerWallet = newContractOwner;
        contract = pixelmonEvolution;
        mockFTContract = mockFT;
        mockNFTContract = mockNFT;
        signerWallet = signer;
    });

    async function createSignature(pixelmonTokenIds, serumIds, amounts, evolutionStage, nonce, tokenOwner, contract, signer) {
        const hashPixelmonTokenIds = await contract.getHashIntFromArray(pixelmonTokenIds);
        const hashSerumIds = await contract.getHashIntFromArray(serumIds);
        const hashAmounts = await contract.getHashIntFromArray(amounts);

        const signatureObject = {
            pixelmonTokenIds: hashPixelmonTokenIds,
            serumIds: hashSerumIds,
            serumAmounts: hashAmounts,
            evolutionStage,
            nonce,
            tokenOwner,
        };

        const chainId = 31337;
        const SIGNING_DOMAIN_NAME = "Pixelmon-Evolution";
        const SIGNING_DOMAIN_VERSION = "1";
        const types = {
            PixelmonEvolutionSignature: [
                { name: "pixelmonTokenIds", type: "uint256" },
                { name: "serumIds", type: "uint256" },
                { name: "serumAmounts", type: "uint256" },
                { name: "evolutionStage", type: "uint256" },
                { name: "nonce", type: "uint256" },
                { name: "tokenOwner", type: "address" },
            ],
        };
        const domain = {
            name: SIGNING_DOMAIN_NAME,
            version: SIGNING_DOMAIN_VERSION,
            verifyingContract: contract.address,
            chainId,
        };

        const signature = await signer._signTypedData(domain, types, signatureObject);
        return signature;
    }

    it("Contract should be deployed", async function () {
        expect(contract.address).not.to.be.null;

        const pixelmonContract = await contract.PIXELMON_CONTRACT();
        expect(pixelmonContract).to.equal(mockNFTContract.address);

        const signer = await contract.SIGNER();
        expect(signer).to.equal(signerWallet.address);

        const serumContract = await contract.SERUM_CONTRACT();
        expect(serumContract).to.equal(mockFTContract.address);
    });

    it("recoverSignerFromSignature will recover signer wallet from signature", async function () {
        const pixelmonTokenIds = [1, 2, 3, 4];
        const serumIds = [1, 2];
        const amounts = [4, 5];
        const evolutionStage = 2;
        const nonce = 1;

        const signature = await createSignature(
            pixelmonTokenIds,
            serumIds,
            amounts,
            evolutionStage,
            nonce,
            anonymousUserWallet.address,
            contract,
            signerWallet
        );
        let signer = await contract.recoverSignerFromSignature(
            pixelmonTokenIds,
            serumIds,
            amounts,
            evolutionStage,
            nonce,
            anonymousUserWallet.address,
            signature
        );

        expect(signer).to.equal(signerWallet.address);
    });

    it("recoverSignerFromSignature will not recover signer wallet from signature for invalid data", async function () {
        const pixelmonTokenIds = [1, 2, 3, 4];
        const serumIds = [1, 2];
        const amounts = [4, 5];
        const evolutionStage = 2;
        const nonce = 1;

        const signature = await createSignature(
            pixelmonTokenIds,
            serumIds,
            amounts,
            evolutionStage,
            nonce,
            anonymousUserWallet.address,
            contract,
            signerWallet
        );
        let signer = await contract.recoverSignerFromSignature(
            pixelmonTokenIds,
            [1, 2, 3, 4, 5],
            amounts,
            evolutionStage,
            nonce,
            anonymousUserWallet.address,
            signature
        );

        expect(signer).to.not.equal(signerWallet.address);
    });

    it("Only contract owner will be able to setPixelmonAddress", async function () {
        await expect(contract.connect(anonymousUserWallet).setPixelmonAddress(anonymousUserWallet.address)).to.be.revertedWith(NOT_CURRENT_OWNER);
        await contract.connect(contractDeployerWallet).setPixelmonAddress(anonymousUserWallet.address);
        const pixelmonContract = await contract.PIXELMON_CONTRACT();
        expect(pixelmonContract).to.equal(anonymousUserWallet.address);
    });

    it("Only contract owner will be able to setSerumAddress", async function () {
        await expect(contract.connect(anonymousUserWallet).setSerumAddress(anonymousUserWallet.address)).to.be.revertedWith(NOT_CURRENT_OWNER);
        await contract.connect(contractDeployerWallet).setSerumAddress(anonymousUserWallet.address);
        const serumContract = await contract.SERUM_CONTRACT();
        expect(serumContract).to.equal(anonymousUserWallet.address);
    });

    it("Only contract owner will be able to setSignerAddress", async function () {
        await expect(contract.connect(anonymousUserWallet).setSignerAddress(anonymousUserWallet.address)).to.be.revertedWith(NOT_CURRENT_OWNER);
        await contract.connect(contractDeployerWallet).setSignerAddress(anonymousUserWallet.address);
        const signer = await contract.SIGNER();
        expect(signer).to.equal(anonymousUserWallet.address);
    });

    it("evolvePixelmon will revert if serumIds and amounts length is not same", async function () {
        const pixelmonTokenIds = [1, 2, 3, 4];
        const serumIds = [1, 2];
        const amounts = [4, 5, 6];
        const evolutionStage = 2;
        const nonce = 1;

        const signature = await createSignature(
            pixelmonTokenIds,
            serumIds,
            amounts,
            evolutionStage,
            nonce,
            anonymousUserWallet.address,
            contract,
            signerWallet
        );

        await expect(
            contract.connect(anonymousUserWallet).evolvePixelmon(pixelmonTokenIds, serumIds, amounts, evolutionStage, nonce, signature)
        ).to.be.revertedWithCustomError(contract, "InvalidData");
    });

    it("evolvePixelmon will revert if serum amount and pixelmon token amount is not same", async function () {
        const pixelmonTokenIds = [1, 2, 3, 4];
        const serumIds = [1, 2];
        const amounts = [4, 5];
        const evolutionStage = 2;
        const nonce = 1;

        const signature = await createSignature(
            pixelmonTokenIds,
            serumIds,
            amounts,
            evolutionStage,
            nonce,
            anonymousUserWallet.address,
            contract,
            signerWallet
        );

        await expect(
            contract.connect(anonymousUserWallet).evolvePixelmon(pixelmonTokenIds, serumIds, amounts, evolutionStage, nonce, signature)
        ).to.be.revertedWithCustomError(contract, "InvalidAmount");
    });

    it("evolvePixelmon will revert if wallet nonce is not matched", async function () {
        const pixelmonTokenIds = [1, 2, 3, 4];
        const serumIds = [1, 2];
        const amounts = [1, 3];
        const evolutionStage = 2;
        const nonce = 1;

        const signature = await createSignature(
            pixelmonTokenIds,
            serumIds,
            amounts,
            evolutionStage,
            nonce,
            anonymousUserWallet.address,
            contract,
            signerWallet
        );

        await expect(
            contract.connect(anonymousUserWallet).evolvePixelmon(pixelmonTokenIds, serumIds, amounts, evolutionStage, nonce, signature)
        ).to.be.revertedWithCustomError(contract, "InvalidNonce");
    });

    it("evolvePixelmon will revert if wallet for invalid signature", async function () {
        const pixelmonTokenIds = [1, 2, 3, 4];
        const serumIds = [1, 2];
        const amounts = [1, 3];
        const evolutionStage = 2;
        const nonce = 0;

        const signature = await createSignature(
            pixelmonTokenIds,
            serumIds,
            amounts,
            evolutionStage,
            nonce,
            anonymousUserWallet.address,
            contract,
            signerWallet
        );

        await expect(
            contract.connect(anonymousUserWallet).evolvePixelmon([2, 1, 3, 4], serumIds, amounts, evolutionStage, nonce, signature)
        ).to.be.revertedWithCustomError(contract, "InvalidSignature");
    });

    it("evolvePixelmon will revert contract is not set approved for all", async function () {
        const pixelmonTokenIds = [1, 2, 3, 4];
        const serumIds = [1, 2];
        const amounts = [1, 3];
        const evolutionStage = 2;
        const nonce = 0;

        const signature = await createSignature(
            pixelmonTokenIds,
            serumIds,
            amounts,
            evolutionStage,
            nonce,
            anonymousUserWallet.address,
            contract,
            signerWallet
        );

        await mockFTContract.connect(anonymousUserWallet).mint(1, 1);
        await mockFTContract.connect(anonymousUserWallet).mint(2, 3);

        await expect(
            contract.connect(anonymousUserWallet).evolvePixelmon(pixelmonTokenIds, serumIds, amounts, evolutionStage, nonce, signature)
        ).to.be.revertedWith("ERC1155: caller is not token owner or approved");
    });

    it("evolvePixelmon will revert user does not have proper serum balance", async function () {
        const pixelmonTokenIds = [1, 2, 3, 4];
        const serumIds = [1, 2];
        const amounts = [1, 3];
        const evolutionStage = 2;
        const nonce = 0;

        const signature = await createSignature(
            pixelmonTokenIds,
            serumIds,
            amounts,
            evolutionStage,
            nonce,
            anonymousUserWallet.address,
            contract,
            signerWallet
        );

        await mockFTContract.connect(anonymousUserWallet).mint(1, 1);
        await mockFTContract.connect(anonymousUserWallet).mint(2, 1);
        await mockFTContract.connect(anonymousUserWallet).setApprovalForAll(contract.address, true);

        await expect(
            contract.connect(anonymousUserWallet).evolvePixelmon(pixelmonTokenIds, serumIds, amounts, evolutionStage, nonce, signature)
        ).to.be.revertedWith("ERC1155: insufficient balance for transfer");
    });

    it("evolvePixelmon will revert user is not owner of the pixelmon NFT", async function () {
        const pixelmonTokenIds = [1, 2, 3, 4];
        const serumIds = [1, 2];
        const amounts = [1, 3];
        const evolutionStage = 2;
        const nonce = 0;

        const signature = await createSignature(
            pixelmonTokenIds,
            serumIds,
            amounts,
            evolutionStage,
            nonce,
            anonymousUserWallet.address,
            contract,
            signerWallet
        );

        await mockFTContract.connect(anonymousUserWallet).mint(1, 1);
        await mockFTContract.connect(anonymousUserWallet).mint(2, 3);
        await mockFTContract.connect(anonymousUserWallet).setApprovalForAll(contract.address, true);

        await mockNFTContract.safeBatchMint(contractDeployerWallet.address, 10);

        await expect(
            contract.connect(anonymousUserWallet).evolvePixelmon(pixelmonTokenIds, serumIds, amounts, evolutionStage, nonce, signature)
        ).to.be.revertedWithCustomError(contract, "InvalidOwner");
    });

    it("evolvePixelmon will successful for valid data and pixelmon and serum owner", async function () {
        const pixelmonTokenIds = [1, 2, 3, 4];
        const serumIds = [1, 2];
        const amounts = [1, 3];
        const evolutionStage = 2;
        const nonce = 0;

        const signature = await createSignature(
            pixelmonTokenIds,
            serumIds,
            amounts,
            evolutionStage,
            nonce,
            anonymousUserWallet.address,
            contract,
            signerWallet
        );

        await mockFTContract.connect(anonymousUserWallet).mint(1, 1);
        await mockFTContract.connect(anonymousUserWallet).mint(2, 3);
        await mockFTContract.connect(anonymousUserWallet).setApprovalForAll(contract.address, true);

        await mockNFTContract.safeBatchMint(anonymousUserWallet.address, 10);

        await contract.connect(anonymousUserWallet).evolvePixelmon(pixelmonTokenIds, serumIds, amounts, evolutionStage, nonce, signature);
    });

    it("Attack test from attacker contract", async function () {
        const pixelmonTokenIds = [1, 2, 3, 4];
        const serumIds = [1, 2];
        const amounts = [1, 3];
        const evolutionStage = 2;
        const nonce = 0;

        const signature = await createSignature(
            pixelmonTokenIds,
            serumIds,
            amounts,
            evolutionStage,
            nonce,
            anonymousUserWallet.address,
            contract,
            signerWallet
        );

        await mockFTContract.connect(anonymousUserWallet).mint(1, 1);
        await mockFTContract.connect(anonymousUserWallet).mint(2, 3);
        await mockFTContract.connect(anonymousUserWallet).setApprovalForAll(contract.address, true);

        await mockNFTContract.safeBatchMint(anonymousUserWallet.address, 10);

        const Attacker = await hre.ethers.getContractFactory("Attacker");
        const attacker = await Attacker.deploy();
        await attacker.deployed();

        await expect(attacker.attack(contract.address, pixelmonTokenIds, serumIds, amounts, signature)).to.be.revertedWith("tx.origin != msg.sender");
    });
});

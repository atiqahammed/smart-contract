const { ethers } = require("hardhat");
// require("dotenv").config();

const NOT_CURRENT_OWNER = "Ownable: caller is not the owner";

async function deployContract() {
    const accounts = await ethers.getSigners();
    const deployer = accounts[0];
    const newContractOwner = accounts[5];
    const anonymousWallet = accounts[9];
    const signer = accounts[8];

    const MockFT = await ethers.getContractFactory("MockFT");
    const mockFT = await MockFT.deploy();
    await mockFT.deployed();

    const MockNFT = await ethers.getContractFactory("MockNFT");
    const mockNFT = await MockNFT.deploy();
    await mockNFT.deployed();

    const PixelmonEvolution = await hre.ethers.getContractFactory("PixelmonEvolution");
    const pixelmonEvolution = await PixelmonEvolution.deploy(mockNFT.address, mockFT.address, signer.address);
    await pixelmonEvolution.deployed();

    // const Attacker = await hre.ethers.getContractFactory("Attacker");
    // const attacker = await Attacker.deploy();
    // await attacker.deployed();

    // const ClaimGift = await hre.ethers.getContractFactory("ClaimGift");
    // let _claimingStartTimestamp = process.env.CLAIMING_START_TIME_STAMP;
    // let _claimingEndTimestamp = process.env.CLAIMING_END_TIME_STAMP;
    
    // const claimGift = await ClaimGift.deploy(
    //     animeMetaverseReward.address,
    //     giftTransferCaller.address,
    //     _claimingStartTimestamp,
    //     _claimingEndTimestamp
    // );
    // await claimGift.deployed();

    // const MuNFT = await ethers.getContractFactory("MuNFT");
    // const muNFT = await MuNFT.deploy();
    // await muNFT.deployed();

    return {
        deployer,
        anonymousWallet,
        newContractOwner,
        mockFT,
        mockNFT,
        pixelmonEvolution,
        signer,
        // attacker,
        // giftTransferCaller,
    };
}

module.exports = {
    deployContract,
    NOT_CURRENT_OWNER,
};

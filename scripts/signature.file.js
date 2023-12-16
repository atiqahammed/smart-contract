// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const hre = require("hardhat");
require("dotenv").config();

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

    const chainId = 5;
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

async function main() {
    // Hardhat always runs the compile task when running scripts with its command
    // line interface.
    //
    // If this script is run directly using `node` you may want to call compile
    // manually to make sure everything is compiled
    // await hre.run('compile');

    // We get the contract to deploy

    let pixelmonContract = process.env.PIXELMON_CONTRACT;
    let serumContract = process.env.SERUM_CONTRACT;
    let signerWallet = process.env.SIGNER_WALLET;

    const PixelmonEvolution = await hre.ethers.getContractFactory("PixelmonEvolution");
    const pixelmonEvolution = PixelmonEvolution.attach('0x47Bb0fE60a054b3CF0d5e8709E7828eF2A8F1F4C');
    const accounts = await hre.ethers.getSigners();
    const deployer = accounts[0];

    let signature = await createSignature([72], [1], [1], 2, 0, deployer.address, pixelmonEvolution, deployer);
    console.log(signature);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });

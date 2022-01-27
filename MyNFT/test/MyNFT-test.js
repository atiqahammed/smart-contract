const { expect } = require("chai");
const hardhat = require("hardhat");
const { ethers } = hardhat;

describe("MyNFT", function() {
  it("Should deploy", async function() {
    const signers = await ethers.getSigners();
    const minter = signers[0].address;
    expect(minter).not.null;
    const myNFT = await ethers.getContractFactory("MyNFT");
    const nft = await myNFT.deploy();
    console.log(nft)

    await nft.deployed();
  });

});

const { expect } = require("chai");
const hardhat = require("hardhat");
const { ethers } = hardhat;

describe("MyToken3 Test", function() {
  it("Deploy and Mint", async function() {
    const signers = await ethers.getSigners();
    const defaultAdmin = signers[0];
    const minter = signers[1];
    const burner = signers[2];
    const myToken = await ethers.getContractFactory("MyToken3");
    const token = await myToken.deploy();
    await token.deployed();

    console.log('MyToken3 token ', token);

    const res = await token.setMinter(minter.address);
    const brres = await token.setBurner(burner.address);

    console.log('res', res);
    

    const thirdParty = signers[3];

    const minterFactory = myToken.connect(minter);
    const minterContract = minterFactory.attach(token.address);

    const mintingResponse = await minterContract.mint(thirdParty.address, 10);
    console.log(mintingResponse);

    // const name = await token.name();
    // console.log(name);
    // console.log(token);
    // const mintToAddress = signers[1].address;


    // const mintintResult = await token.mint(mintToAddress, 10);

    // const mintRole = await token.MINTER_ROLE();
    // console.log('mintRole',  mintRole);

    // // console.log('mintintResult');
    // // console.log(mintintResult);


    // const contractAddress = token.address;
    // console.log('contractAddress', contractAddress);


    // const thirdParty = signers[2];
    
    


    // const mintintResult2 = await MintContract.mint(mintToAddress, 10);
    // console.log('mintintResult2', mintintResult2);
    // // console.log('MintContract', MintContract);

    // // const mintResponse = await MintContract.mint(voucher);







  });

});

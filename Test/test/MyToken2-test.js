const { expect } = require("chai");
const hardhat = require("hardhat");
const { ethers } = hardhat;

describe("MyToken2", function() {
  it("Deploy and Mint", async function() {
    const signers = await ethers.getSigners();
    const minter = signers[0];
    const burner = signers[1];
    const myToken = await ethers.getContractFactory("MyToken2");
    const token = await myToken.deploy(minter.address, burner.address);
    await token.deployed();


    const thirdParty = signers[2];

    const mintResponse = await token.mint(thirdParty.address, 10);

    const burnerFactory = myToken.connect(burner);
    const contractAddress = token.address;
    const burnerContract = burnerFactory.attach(contractAddress);

    // const mintRole2 = await MintContract.MINTER_ROLE();
    // console.log('mintRole2',  mintRole2);

    const burnResponse = await burnerContract.burn(thirdParty.address, 10);

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

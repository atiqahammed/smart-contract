pragma solidity ^0.8.0;

contract Counter {

    uint public count = 1;
    string public name = "Atiq Ahammed";

    constructor(string memory _name, uint _initialCount) {
        name = _name;
        count = _initialCount;
    }

    function increment() public returns (uint newCount) {
        count ++;
        return count;
    }

    function decrement() public returns (uint newCount) {
        count --;
        return count;
    }

    function getCount() public view returns (uint currentCount) {
        return count;
    }

    function getName() public view returns (string memory currentName) {
        return name;
    }

    function setName(string memory _newName) public returns(string memory newName) {
        name = _newName;
        return name;
    }
}
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title MockERC20
 * @dev Mock ERC-20 token (FSUSD - FairShare USD) with a public faucet for testing
 */
contract MockERC20 {
    string public name = "FairShare USD";
    string public symbol = "FSUSD";
    uint8 public decimals = 6; // Like USDC
    uint256 public totalSupply;

    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);

    constructor() {
        _mint(msg.sender, 1000000 * 10**6); // Mint 1,000,000 FSUSD to deployer
    }

    function transfer(address to, uint256 value) external returns (bool) {
        require(balanceOf[msg.sender] >= value, "MockERC20: Insufficient balance");
        balanceOf[msg.sender] -= value;
        balanceOf[to] += value;
        emit Transfer(msg.sender, to, value);
        return true;
    }

    function approve(address spender, uint256 value) external returns (bool) {
        allowance[msg.sender][spender] = value;
        emit Approval(msg.sender, spender, value);
        return true;
    }

    function transferFrom(address from, address to, uint256 value) external returns (bool) {
        require(balanceOf[from] >= value, "MockERC20: Insufficient balance");
        require(allowance[from][msg.sender] >= value, "MockERC20: Insufficient allowance");
        balanceOf[from] -= value;
        allowance[from][msg.sender] -= value;
        balanceOf[to] += value;
        emit Transfer(from, to, value);
        return true;
    }

    /**
     * @notice Public testnet faucet: mints 500 FSUSD to the caller
     */
    function faucet() external {
        _mint(msg.sender, 500 * 10**6);
    }

    function _mint(address to, uint256 value) internal {
        totalSupply += value;
        balanceOf[to] += value;
        emit Transfer(address(0), to, value);
    }
}

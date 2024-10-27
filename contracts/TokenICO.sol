// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.0;

interface ERC20{
    function transfer(address recipient,uint amount) external returns(bool);

    function balanceOf(address account) external view returns(uint);

    function allowance(address owner, address spender) external view returns(uint);

    function approve(address spender, uint amount) external returns(bool);

    function transferFrom(address spender, address recipient, uint amount) external returns(bool);

    function symbol() external view returns(string memory);

    function totalSupply() external view returns(uint);

    function name() external view returns(string memory);
}


contract TokenICO{
    address public owner;
    address public tokenAddress;
    uint public tokenSalePrice;
    uint public soldTokens;

    modifier onlyOwner(){
        require(msg.sender == owner, "Only contract owner can perform this action");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function updateToken(address _tokenAddress) public onlyOwner{
        tokenAddress = _tokenAddress;
    }

    function updateTokenSalePrice(uint _tokenSalePrice) public onlyOwner{
        tokenSalePrice = _tokenSalePrice;
    }

    function multiply(uint x, uint y) internal pure returns(uint z){
        require(y==0 || (z=x*y)/y==x);
    }

    function buyToken(uint _amount) public payable{
        require(msg.value==multiply(_amount, tokenSalePrice),"Insufficient Ether provided for the token purchase");
        ERC20 token = ERC20(tokenAddress);
        require(token.balanceOf(address(this))>=_amount,"Insufficient Ether provided for the token purchase");
        require(token.transfer(msg.sender,_amount*1e18));
        payable(owner).transfer(msg.value);
        soldTokens+=_amount;
    }

    function getTokenDetails() public view returns(string memory name, string memory symbol,uint balance, uint supply, uint tokenPrice, address tokenAddr){
        name = ERC20(tokenAddress).name();
        symbol = ERC20(tokenAddress).symbol();
        balance = ERC20(tokenAddress).balanceOf(address(this));
        supply = ERC20(tokenAddress).totalSupply();
        tokenPrice = tokenSalePrice;
        tokenAddr = tokenAddress;

        return (name,symbol,balance,supply,tokenPrice,tokenAddr);
    }

     function withdrawAllTokens() public onlyOwner{
        ERC20 token = ERC20(tokenAddress);

        uint balance = token.balanceOf(address(this));
        
        require(balance>0,"No token to withdraw");

        require(token.transfer(owner, balance));
    }
}
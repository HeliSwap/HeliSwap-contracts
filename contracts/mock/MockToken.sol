// SPDX-License-Identifier: GPL-3.0-or-later

pragma solidity ^0.8.7;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";

contract MockToken is ERC20, ERC20Burnable {

    constructor(string memory name, string memory symbol) ERC20(name, symbol) { }
    
    function mint(address to, uint256 amount) public virtual {
        require(amount > 0);
        _mint(to, amount);
    }

}
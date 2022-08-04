pragma solidity =0.5.16;

import './interfaces/IUniswapV2Factory.sol';
import './UniswapV2Pair.sol';

/******************************************************************************\
* Original UniswapV2Factory authors are
* Zinsmeister, N., Adams, H., Robinson, D., & Salem, M. (2019). v2-core (Version 1.0.1) [Computer software].
* https://github.com/Uniswap/v2-core
*
* Modified the `PairCreated` event in order to emit additional ERC20 metadata
/******************************************************************************/

contract UniswapV2Factory is IUniswapV2Factory {
    address public feeTo;
    address public feeToSetter;

    mapping(address => mapping(address => address)) public getPair;
    address[] public allPairs;

    event PairCreated(
        address indexed token0,
        address indexed token1,
        address pair,
        uint pairSeqNum,
        string token0Symbol,
        string token1Symbol,
        string token0Name,
        string token1Name,
        uint token0Decimals,
        uint token1Decimals);

    event FeeReceiverChanged(address indexed _receiver);
    event FeeSetterChanged(address indexed _feeSetter);

    constructor(address _feeToSetter) public {
        require(_feeToSetter != address(0), 'UniswapV2: ZERO_ADDRESS');
        feeToSetter = _feeToSetter;
    }

    function allPairsLength() external view returns (uint) {
        return allPairs.length;
    }

    function createPair(address tokenA, address tokenB) external returns (address pair) {
        require(tokenA != tokenB, 'UniswapV2: IDENTICAL_ADDRESSES');
        (address token0, address token1) = tokenA < tokenB ? (tokenA, tokenB) : (tokenB, tokenA);
        require(token0 != address(0), 'UniswapV2: ZERO_ADDRESS');
        require(getPair[token0][token1] == address(0), 'UniswapV2: PAIR_EXISTS'); // single check is sufficient
        bytes memory bytecode = type(UniswapV2Pair).creationCode;
        bytes32 salt = keccak256(abi.encodePacked(token0, token1));
        assembly {
            pair := create2(0, add(bytecode, 32), mload(bytecode), salt)
        }
        IUniswapV2Pair(pair).initialize(token0, token1);
        getPair[token0][token1] = pair;
        getPair[token1][token0] = pair; // populate mapping in the reverse direction
        allPairs.push(pair);

        string memory token0Symbol = IERC20(token0).symbol();
        string memory token0Name = IERC20(token0).name();
        uint token0Decimals = IERC20(token0).decimals();

        string memory token1Symbol = IERC20(token1).symbol();
        string memory token1Name = IERC20(token1).name();
        uint token1Decimals = IERC20(token1).decimals();

        emit PairCreated(
            token0,
            token1,
            pair,
            allPairs.length,
            token0Symbol,
            token1Symbol,
            token0Name,
            token1Name,
            token0Decimals,
            token1Decimals
        );
    }

    function setFeeTo(address _feeTo) external {
        require(msg.sender == feeToSetter, 'UniswapV2: FORBIDDEN');
        feeTo = _feeTo;
        emit FeeReceiverChanged(_feeTo);
    }

    function setFeeToSetter(address _feeToSetter) external {
        require(msg.sender == feeToSetter, 'UniswapV2: FORBIDDEN');
        feeToSetter = _feeToSetter;
        emit FeeSetterChanged(_feeToSetter);
    }
}
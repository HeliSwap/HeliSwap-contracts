pragma solidity =0.6.6;

import "./interfaces/IERC20.sol";
import "./interfaces/IWHBAR.sol";
import "./libraries/UniswapV2Library.sol";
import "./interfaces/IUniswapV2Router02.sol";

contract Migration {
    IUniswapV2Router02 public immutable oldRouter;
    IUniswapV2Router02 public immutable newRouter;
    address public immutable oldFactory;

    constructor(address _oldRouter, address _newRouter) public {
        oldRouter = IUniswapV2Router02(_oldRouter);
        newRouter = IUniswapV2Router02(_newRouter);
        oldFactory = IUniswapV2Router02(_oldRouter).factory();
    }

    function migrateWithHBAR(
        address _tokenAddress,
        address _whbar,
        uint _liquidity,
        uint _amoutAMin,
        uint _amoutBMin,
        address _userAddress,
        uint _deadline
    ) external {
        // Transfer LP tokens to migration contract
        address pair = UniswapV2Library.pairFor(
            oldFactory,
            _tokenAddress,
            _whbar
        );
        IERC20(pair).transferFrom(msg.sender, address(this), _liquidity);

        // Remove liquidity from old pool/router
        (uint amountToken, uint amountHBAR) = oldRouter.removeLiquidityHBAR(
            _tokenAddress,
            _liquidity,
            0,
            0,
            address(this),
            _deadline
        );

        // Give approval to new router to spend tokens
        IERC20(_tokenAddress).approve(address(newRouter), amountToken);

        // Provide native liquidity to new pool assuming the ratios are the same?
        newRouter.addLiquidityHBAR{value: amountHBAR}(
            _tokenAddress,
            amountToken,
            _amoutAMin,
            amountHBAR,
            _userAddress,
            _deadline
        );
    }

    // Write similar function for non native liquidity provison
    function migrate(
        address _tokenA,
        address _tokenB,
        uint _liquidity,
        uint _amoutAMin,
        uint _amoutBMin,
        uint _deadline
    ) external {
        // Transfer LP tokens to migration contract
        address pair = UniswapV2Library.pairFor(oldFactory, _tokenA, _tokenB);
        IERC20(pair).transferFrom(msg.sender, address(this), _liquidity);

        // Remove liquidity from old pool/router
        (uint amountA, uint amountB) = oldRouter.removeLiquidity(
            _tokenA,
            _tokenB,
            _liquidity,
            0,
            0,
            address(this),
            _deadline
        );

        // Give approval to new router to spend tokens
        IERC20(_tokenA).approve(address(newRouter), amountA);
        IERC20(_tokenB).approve(address(newRouter), amountB);

        // Provide liquidity to new pool assuming the ratios are the same
        newRouter.addLiquidity(
            _tokenA,
            _tokenB,
            amountA,
            amountB,
            _amoutAMin,
            _amoutBMin,
            msg.sender,
            _deadline
        );
    }
}

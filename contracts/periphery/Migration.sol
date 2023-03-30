pragma solidity =0.6.6;

import "./interfaces/IERC20.sol";
import "./interfaces/IWHBAR.sol";
import "./interfaces/IUniswapV2Router02.sol";

contract Migration {
    IUniswapV2Router02 public immutable oldRouter;
    IUniswapV2Router02 public immutable newRouter;

    constructor(address _oldRouter, address _newRouter) public {
        oldRouter = IUniswapV2Router02(_oldRouter);
        newRouter = IUniswapV2Router02(_newRouter);
    }

    function migrateWithHBAR(
        uint _liquidity,
        address _oldPoolAddress,
        address _newPoolAddress,
        address _tokenAddress,
        uint _amountTokenMin,
        uint _amountHBARMin,
        uint _deadline
    ) external {
        // Check reserves and balances of both pools before migration

        // Give aproval to old router to remove liquidity
        IERC20(_oldPoolAddress).approve(address(oldRouter), _liquidity);

        // Remove liquidity from old pool/router
        (uint amountToken, uint amountHBAR) = oldRouter.removeLiquidityHBAR(
            _tokenAddress,
            _liquidity,
            _amountTokenMin,
            _amountHBARMin,
            address(this),
            _deadline
        );

        // Give approval to new router to spend tokens
        IERC20(_tokenAddress).approve(address(newRouter), amountToken);

        // Calculate min amounts with slippage

        // Provide native liquidity to new pool assuming the ratios are the same?
        newRouter.addLiquidityHBAR{value: amountHBAR}(
            _tokenAddress,
            amountToken,
            amountToken,
            amountHBAR,
            msg.sender,
            _deadline
        );
    }

    // Write similar function for non native liquidity provison
}

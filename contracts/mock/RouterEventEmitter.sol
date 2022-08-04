pragma solidity =0.6.6;

import '../periphery/interfaces/IUniswapV2Router01.sol';

contract RouterEventEmitter {
    event Amounts(uint[] amounts);

    receive() external payable {}

    function swapExactTokensForTokens(
        address router,
        uint amountIn,
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    ) external {
        (bool success, bytes memory returnData) = router.delegatecall(abi.encodeWithSelector(
                IUniswapV2Router01(router).swapExactTokensForTokens.selector, amountIn, amountOutMin, path, to, deadline
            ));
        assert(success);
        emit Amounts(abi.decode(returnData, (uint[])));
    }

    function swapTokensForExactTokens(
        address router,
        uint amountOut,
        uint amountInMax,
        address[] calldata path,
        address to,
        uint deadline
    ) external {
        (bool success, bytes memory returnData) = router.delegatecall(abi.encodeWithSelector(
                IUniswapV2Router01(router).swapTokensForExactTokens.selector, amountOut, amountInMax, path, to, deadline
            ));
        assert(success);
        emit Amounts(abi.decode(returnData, (uint[])));
    }

    function swapExactHBARForTokens(
        address router,
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    ) external payable {
        (bool success, bytes memory returnData) = router.delegatecall(abi.encodeWithSelector(
                IUniswapV2Router01(router).swapExactHBARForTokens.selector, amountOutMin, path, to, deadline
            ));
        assert(success);
        emit Amounts(abi.decode(returnData, (uint[])));
    }

    function swapTokensForExactHBAR(
        address router,
        uint amountOut,
        uint amountInMax,
        address[] calldata path,
        address to,
        uint deadline
    ) external {
        (bool success, bytes memory returnData) = router.delegatecall(abi.encodeWithSelector(
                IUniswapV2Router01(router).swapTokensForExactHBAR.selector, amountOut, amountInMax, path, to, deadline
            ));
        assert(success);
        emit Amounts(abi.decode(returnData, (uint[])));
    }

    function swapExactTokensForHBAR(
        address router,
        uint amountIn,
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    ) external {
        (bool success, bytes memory returnData) = router.delegatecall(abi.encodeWithSelector(
                IUniswapV2Router01(router).swapExactTokensForHBAR.selector, amountIn, amountOutMin, path, to, deadline
            ));
        assert(success);
        emit Amounts(abi.decode(returnData, (uint[])));
    }

    function swapHBARForExactTokens(
        address router,
        uint amountOut,
        address[] calldata path,
        address to,
        uint deadline
    ) external payable {
        (bool success, bytes memory returnData) = router.delegatecall(abi.encodeWithSelector(
                IUniswapV2Router01(router).swapHBARForExactTokens.selector, amountOut, path, to, deadline
            ));
        assert(success);
        emit Amounts(abi.decode(returnData, (uint[])));
    }
}
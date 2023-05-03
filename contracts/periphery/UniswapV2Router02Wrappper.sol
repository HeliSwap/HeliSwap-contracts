pragma solidity =0.6.6;

import "./libraries/TransferHelper.sol";
import "./libraries/UniswapV2Library.sol";
import "./libraries/SafeMath.sol";

import "./interfaces/IERC20.sol";
import "./interfaces/IWHBAR.sol";

import "./UniswapV2Router02.sol";

contract UniswapV2Router02Wrapper {
    using SafeMath for uint;

    UniswapV2Router02 public immutable router;
    address public immutable WHBAR;

    constructor(address payable _router, address _WHBAR) public {
        router = UniswapV2Router02(_router);
        WHBAR = _WHBAR;
    }

    receive() external payable {
        assert(msg.sender == WHBAR); // only accept HBAR via fallback from the WHBAR contract
    }

    // **** ADD LIQUIDITY ****
    function addLiquidity(
        address tokenA,
        address tokenB,
        uint amountADesired,
        uint amountBDesired,
        uint amountAMin,
        uint amountBMin,
        address to,
        uint deadline
    ) external virtual returns (uint amountA, uint amountB, uint liquidity) {
        bool isTokenAHTS = optimisticAssociation(tokenA);
        bool isTokenBHTS = optimisticAssociation(tokenB);

        TransferHelper.safeTransferFrom(
            tokenA,
            msg.sender,
            address(this),
            amountADesired
        );
        TransferHelper.safeTransferFrom(
            tokenB,
            msg.sender,
            address(this),
            amountBDesired
        );

        IERC20(tokenA).approve(address(router), amountADesired);
        IERC20(tokenB).approve(address(router), amountBDesired);

        router.addLiquidity(
            tokenA,
            tokenB,
            amountADesired,
            amountBDesired,
            amountAMin,
            amountBMin,
            to,
            deadline
        );

        if (isTokenAHTS) {
            dissociate(tokenA);
        }

        if (isTokenBHTS) {
            dissociate(tokenB);
        }
    }

    function addLiquidityHBAR(
        address token,
        uint amountTokenDesired,
        uint amountTokenMin,
        uint amountHBARMin,
        address to,
        uint deadline
    )
        external
        payable
        virtual
        returns (uint amountToken, uint amountHBAR, uint liquidity)
    {
        bool isHTS = optimisticAssociation(token);

        TransferHelper.safeTransferFrom(
            token,
            msg.sender,
            address(this),
            amountTokenDesired
        );
        IWHBAR(WHBAR).deposit{value: msg.value}();

        IERC20(token).approve(address(router), amountTokenDesired);
        IERC20(WHBAR).approve(address(router), msg.value);

        router.addLiquidity(
            token,
            WHBAR,
            amountTokenDesired,
            msg.value,
            amountTokenMin,
            amountHBARMin,
            to,
            deadline
        );

        if (isHTS) {
            dissociate(token);
        }
    }

    // **** REMOVE LIQUIDITY ****
    function removeLiquidity(
        address tokenA,
        address tokenB,
        uint liquidity,
        uint amountAMin,
        uint amountBMin,
        address to,
        uint deadline
    ) public virtual returns (uint amountA, uint amountB) {
        address pair = UniswapV2Library.pairFor(
            router.factory(),
            tokenA,
            tokenB
        );
        IUniswapV2Pair(pair).transferFrom(msg.sender, address(this), liquidity);

        IERC20(pair).approve(address(router), liquidity);

        bool isTokenAHTS = optimisticAssociation(tokenA);
        bool isTokenBHTS = optimisticAssociation(tokenB);

        (amountA, amountB) = router.removeLiquidity(
            tokenA,
            tokenB,
            liquidity,
            amountAMin,
            amountBMin,
            address(this),
            deadline
        );

        TransferHelper.safeTransfer(tokenA, to, amountA);
        TransferHelper.safeTransfer(tokenB, to, amountB);

        if (isTokenAHTS) {
            dissociate(tokenA);
        }

        if (isTokenBHTS) {
            dissociate(tokenB);
        }
    }

    function removeLiquidityHBAR(
        address token,
        uint liquidity,
        uint amountTokenMin,
        uint amountHBARMin,
        address to,
        uint deadline
    ) public virtual returns (uint amountToken, uint amountHBAR) {
        bool isHTS = optimisticAssociation(token);

        address pair = UniswapV2Library.pairFor(router.factory(), token, WHBAR);
        IUniswapV2Pair(pair).transferFrom(msg.sender, address(this), liquidity);

        IERC20(pair).approve(address(router), liquidity);

        (amountToken, amountHBAR) = router.removeLiquidity(
            token,
            WHBAR,
            liquidity,
            amountTokenMin,
            amountHBARMin,
            address(this),
            deadline
        );

        IWHBAR(WHBAR).withdraw(amountHBAR);

        TransferHelper.safeTransfer(token, to, amountToken);
        TransferHelper.safeTransferHBAR(to, amountHBAR);

        if (isHTS) {
            dissociate(token);
        }
    }

    // **** REMOVE LIQUIDITY (supporting fee-on-transfer tokens) ****
    function removeLiquidityHBARSupportingFeeOnTransferTokens(
        address token,
        uint liquidity,
        uint amountTokenMin,
        uint amountHBARMin,
        address to,
        uint deadline
    ) public virtual returns (uint amountHBAR) {
        bool isHTS = optimisticAssociation(token);
        (, amountHBAR) = removeLiquidity(
            token,
            WHBAR,
            liquidity,
            amountTokenMin,
            amountHBARMin,
            address(this),
            deadline
        );
        TransferHelper.safeTransfer(
            token,
            to,
            IERC20(token).balanceOf(address(this))
        );
        IWHBAR(WHBAR).withdraw(amountHBAR);
        TransferHelper.safeTransferHBAR(to, amountHBAR);

        if (isHTS) {
            dissociate(token);
        }
    }

    function swapExactTokensForTokens(
        uint amountIn,
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    ) external virtual returns (uint[] memory amounts) {
        bool isHTS = optimisticAssociation(path[0]);

        TransferHelper.safeTransferFrom(
            path[0],
            msg.sender,
            address(this),
            amountIn
        );

        IERC20(path[0]).approve(address(router), amountIn);

        amounts = router.swapExactTokensForTokens(
            amountIn,
            amountOutMin,
            path,
            to,
            deadline
        );

        if (isHTS) {
            dissociate(path[0]);
        }
    }

    function swapTokensForExactTokens(
        uint amountOut,
        uint amountInMax,
        address[] calldata path,
        address to,
        uint deadline
    ) external virtual returns (uint[] memory amounts) {
        bool isHTS = optimisticAssociation(path[0]);

        TransferHelper.safeTransferFrom(
            path[0],
            msg.sender,
            address(this),
            amountInMax
        );

        IERC20(path[0]).approve(address(router), amountInMax);

        amounts = router.swapTokensForExactTokens(
            amountOut,
            amountInMax,
            path,
            to,
            deadline
        );

        if (isHTS) {
            dissociate(path[0]);
        }
    }

    function swapExactHBARForTokens(
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    ) external payable virtual returns (uint[] memory amounts) {
        IWHBAR(WHBAR).deposit{value: msg.value}();
        IERC20(WHBAR).approve(address(router), msg.value);

        amounts = router.swapExactTokensForTokens(
            msg.value,
            amountOutMin,
            path,
            to,
            deadline
        );
    }

    function swapTokensForExactHBAR(
        uint amountOut,
        uint amountInMax,
        address[] calldata path,
        address to,
        uint deadline
    ) external virtual returns (uint[] memory amounts) {
        bool isHTS = optimisticAssociation(path[0]);

        TransferHelper.safeTransferFrom(
            path[0],
            msg.sender,
            address(this),
            amountInMax
        );

        IERC20(path[0]).approve(address(router), amountInMax);

        amounts = router.swapTokensForExactTokens(
            amountOut,
            amountInMax,
            path,
            to,
            deadline
        );

        if (isHTS) {
            dissociate(path[0]);
        }
    }

    function swapExactTokensForHBAR(
        uint amountIn,
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    ) external virtual returns (uint[] memory amounts) {
        bool isHTS = optimisticAssociation(path[0]);

        TransferHelper.safeTransferFrom(
            path[0],
            msg.sender,
            address(this),
            amountIn
        );

        IERC20(path[0]).approve(address(router), amountIn);

        amounts = router.swapExactTokensForTokens(
            amountIn,
            amountOutMin,
            path,
            to,
            deadline
        );

        if (isHTS) {
            dissociate(path[0]);
        }
    }

    function swapHBARForExactTokens(
        uint amountOut,
        address[] calldata path,
        address to,
        uint deadline
    ) external payable virtual returns (uint[] memory amounts) {
        IWHBAR(WHBAR).deposit{value: msg.value}();
        IERC20(WHBAR).approve(address(router), msg.value);

        amounts = router.swapTokensForExactTokens(
            amountOut,
            msg.value,
            path,
            to,
            deadline
        );
    }

    function swapExactTokensForTokensSupportingFeeOnTransferTokens(
        uint amountIn,
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    ) external virtual {
        bool isHTS = optimisticAssociation(path[0]);

        TransferHelper.safeTransferFrom(
            path[0],
            msg.sender,
            address(this),
            amountIn
        );

        IERC20(path[0]).approve(address(router), amountIn);

        router.swapExactTokensForTokensSupportingFeeOnTransferTokens(
            amountIn,
            amountOutMin,
            path,
            to,
            deadline
        );

        if (isHTS) {
            dissociate(path[0]);
        }
    }

    function swapExactHBARForTokensSupportingFeeOnTransferTokens(
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    ) external payable virtual {
        uint amountIn = msg.value;
        IWHBAR(WHBAR).deposit{value: amountIn}();
        IERC20(WHBAR).approve(address(router), amountIn);

        router.swapExactTokensForTokensSupportingFeeOnTransferTokens(
            amountIn,
            amountOutMin,
            path,
            to,
            deadline
        );
    }

    function swapExactTokensForHBARSupportingFeeOnTransferTokens(
        uint amountIn,
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    ) external virtual {
        bool isHTS = optimisticAssociation(path[0]);

        TransferHelper.safeTransferFrom(
            path[0],
            msg.sender,
            address(this),
            amountIn
        );

        IERC20(path[0]).approve(address(router), amountIn);

        router.swapExactTokensForHBARSupportingFeeOnTransferTokens(
            amountIn,
            amountOutMin,
            path,
            to,
            deadline
        );

        IWHBAR(WHBAR).withdraw(amountOutMin);
        TransferHelper.safeTransferHBAR(to, amountOutMin);

        if (isHTS) {
            dissociate(path[0]);
        }
    }

    // calls HTS precompile in order to execute optimistic association
    function optimisticAssociation(address token) internal returns (bool) {
        (bool success, bytes memory result) = address(0x167).call(
            abi.encodeWithSignature(
                "associateToken(address,address)",
                address(this),
                token
            )
        );
        require(success, "HTS Precompile: CALL_EXCEPTION");
        int32 responseCode = abi.decode(result, (int32));
        // Success = 22; Non-HTS token (erc20) = 167
        require(
            responseCode == 22 || responseCode == 167,
            "HTS Precompile: CALL_ERROR"
        );
        return responseCode == 22;
    }

    // calls HTS precompile in order to execute token dissociation
    function dissociate(address token) internal {
        (bool success, bytes memory result) = address(0x167).call(
            abi.encodeWithSignature(
                "dissociateToken(address,address)",
                address(this),
                token
            )
        );
        require(success, "HTS Precompile: CALL_EXCEPTION");
        int32 responseCode = abi.decode(result, (int32));
        require(responseCode == 22);
    }

    function balance() public view returns (uint256) {
        return address(this).balance;
    }
}

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
            _whbar,
            _tokenAddress
        );
        IERC20(pair).transferFrom(msg.sender, address(this), _liquidity);

        IERC20(pair).approve(address(oldRouter), _liquidity);

        bool isHTS = optimisticAssociation(_tokenAddress);

        // Remove liquidity from old pool/router
        (uint amountToken, uint amountHBAR) = oldRouter.removeLiquidityHBAR(
            _tokenAddress,
            _liquidity,
            0,
            0,
            address(this),
            _deadline
        );

        // // Give approval to new router to spend tokens
        // IERC20(_tokenAddress).approve(address(newRouter), amountToken);

        // // Provide native liquidity to new pool assuming the ratios are the same?
        // newRouter.addLiquidityHBAR{value: amountHBAR}(
        //     _tokenAddress,
        //     amountToken,
        //     _amoutAMin,
        //     amountHBAR,
        //     _userAddress,
        //     _deadline
        // );

        if (isHTS) {
            dissociate(_tokenAddress);
        }
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
}

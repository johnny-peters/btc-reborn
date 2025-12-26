// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract BTCR is ERC20, ReentrancyGuard {
    uint256 public constant ENTRY_FEE = 0.001 ether;
    uint256 public constant DECIMALS_MULTIPLIER = 1e18;
    uint256 public constant REWARD_PRECISION = 1e12;
    uint256 public constant HALF_BLOCK_NUM = 210000;
    uint256 public constant BLOCK_TIME = 600;
    uint256 public constant NEWBEE_TIME = 180;
    uint256 public constant INITIAL_BLOCK_PROFIT = 50 * 1e18;
    uint256 public constant NEWBEE_THRESHOLD = 30;
    uint256 public constant DIVIDEND_THRESHOLD = 80;
    uint256 public constant MAX_ENTRY_COUNT = 100;
    uint256 public constant MAX_ROUND = 6;
    address public constant devAddress = 0x5f1eab5dDA8f3A053e65E625B7325b006C28404E;

    error InvalidEntryFee();
    error AlreadyJoined();
    error OnlyNewbiesAllowed();
    error AmountMustBeGreaterThanZero();
    error InsufficientBalance();
    error PriceNotSet();
    error InsufficientBurnFee();
    error ETHTransferFailed();
    error NoPlayersInBlock();
    error EpochNotFinalized();
    error DevFeeTransferFailed();

    struct EpochResult {
        uint128 tokenPerShare;
        uint128 ethPerPlayer;
        bool finalized;
    }

    struct UserInfo {
        uint128 epochId;
        uint128 share;
        bool claimed;
    }

    uint256 public round = 1;
    uint256 public currentEpochId = 1;

    uint256 public blockNum;
    uint256 public blockProfit = INITIAL_BLOCK_PROFIT;
    uint256 public lastBlockTimestamp;

    uint256 public entryCount;
    uint256 public shareSum;

    mapping(uint256 => EpochResult) public epochResults;
    mapping(address => UserInfo) public userInfo;

    uint256 public allocateNum = 3;
    uint256 public price;
    uint256 public burnFee;
    uint256 public poolFee;
    uint256 public devFee;
    uint256 public totalBurned;

    event Played(address indexed player, uint256 share, uint256 entryCount, uint256 epochId);
    event BlockMined(
        uint256 indexed epochId,
        uint256 blockNum,
        uint256 blockPercent,
        uint256 totalProfit
    );
    event DividendDistributed(uint256 indexed epochId, uint256 playerCount, uint256 totalReward);
    event Halved(uint256 newRound, uint256 newBlockProfit);
    event Burned(address indexed user, uint256 amount, uint256 ethReturned);
    event DevFeeWithdrawn(address indexed dev, uint256 amount);
    event Claimed(address indexed user, uint256 tokenAmount, uint256 ethAmount, uint256 epochId);
    event UnexpectedETHReceived(address indexed sender, uint256 amount);

    constructor() ERC20("BTC Reborn", "BTCR") {
        lastBlockTimestamp = block.timestamp;
    }

    receive() external payable {
        if (msg.value > 0) {
            unchecked {
                burnFee += msg.value;
            }
            emit UnexpectedETHReceived(msg.sender, msg.value);
        }
    }

    fallback() external payable {
        if (msg.value > 0) {
            unchecked {
                burnFee += msg.value;
            }
            emit UnexpectedETHReceived(msg.sender, msg.value);
        }
    }

    function play() external payable nonReentrant {
        if (msg.value != ENTRY_FEE) revert InvalidEntryFee();

        uint256 _currentEpochId = currentEpochId;
        UserInfo storage user = userInfo[msg.sender];

        if (user.epochId == _currentEpochId) revert AlreadyJoined();

        if (user.epochId > 0 && !user.claimed) {
            _claim(msg.sender);
        }

        uint256 _entryCount = entryCount;
        uint256 _timestamp = block.timestamp;
        uint256 _lastBlockTimestamp = lastBlockTimestamp;

        bool inNewbeePeriod = _timestamp - _lastBlockTimestamp < NEWBEE_TIME;
        bool shouldCheckNewbee = inNewbeePeriod && _entryCount < NEWBEE_THRESHOLD;

        if (shouldCheckNewbee) {
            if (balanceOf(msg.sender) != 0) revert OnlyNewbiesAllowed();
        }

        _register(_currentEpochId, _entryCount, _timestamp);
    }

    function claim() external nonReentrant {
        _claim(msg.sender);
    }

    function burn(uint256 amount) external nonReentrant {
        if (amount == 0) revert AmountMustBeGreaterThanZero();
        if (balanceOf(msg.sender) < amount) revert InsufficientBalance();

        uint256 _price = price;
        if (_price == 0) revert PriceNotSet();

        uint256 ethReturned = (amount * _price) / DECIMALS_MULTIPLIER;

        uint256 _burnFee = burnFee;
        if (ethReturned > _burnFee) revert InsufficientBurnFee();

        unchecked {
            burnFee = _burnFee - ethReturned;
        }

        _burn(msg.sender, amount);

        unchecked {
            totalBurned += amount;
        }

        (bool success, ) = msg.sender.call{ value: ethReturned }("");
        if (!success) revert ETHTransferFailed();

        emit Burned(msg.sender, amount, ethReturned);
    }

    function _claim(address player) internal {
        UserInfo storage user = userInfo[player];

        uint256 _currentEpochId = currentEpochId;

        if (user.claimed) return;
        if (user.epochId == 0 || user.epochId == _currentEpochId) return;

        uint256 userEpochId = user.epochId;
        EpochResult memory result = epochResults[userEpochId];
        if (!result.finalized) revert EpochNotFinalized();

        uint256 tokenReward = (uint256(user.share) * uint256(result.tokenPerShare)) /
            REWARD_PRECISION;
        uint256 ethReward = uint256(result.ethPerPlayer);

        user.claimed = true;

        if (tokenReward > 0) {
            _mint(player, tokenReward);
        }
        if (ethReward > 0) {
            (bool success, ) = player.call{ value: ethReward }("");
            if (!success) revert ETHTransferFailed();
        }

        emit Claimed(player, tokenReward, ethReward, userEpochId);
    }

    function _register(uint256 _currentEpochId, uint256 _entryCount, uint256 _timestamp) internal {
        uint256 _lastBlockTimestamp = lastBlockTimestamp;
        uint256 _allocateNum = allocateNum;

        bool shouldMineBlock = (_entryCount + 1 >= MAX_ENTRY_COUNT) ||
            (_timestamp - _lastBlockTimestamp >= BLOCK_TIME);

        uint256 shareMultiplier = shouldMineBlock ? 2 : 1;
        uint256 balance = balanceOf(msg.sender) / DECIMALS_MULTIPLIER;
        uint256 balanceShare = balance > 40 ? 40 : balance;
        uint256 share = shareMultiplier * (10 + balanceShare);

        userInfo[msg.sender] = UserInfo({
            epochId: uint128(_currentEpochId),
            share: uint128(share),
            claimed: false
        });

        unchecked {
            shareSum += share;
        }

        uint256 feeType = _entryCount % _allocateNum;
        uint256 newEntryCount;
        unchecked {
            if (feeType == 0) {
                burnFee += ENTRY_FEE;
            } else if (feeType == 1) {
                poolFee += ENTRY_FEE;
            } else {
                devFee += ENTRY_FEE;
            }
            newEntryCount = _entryCount + 1;
            entryCount = newEntryCount;
        }

        emit Played(msg.sender, share, newEntryCount, _currentEpochId);

        if (shouldMineBlock) {
            _mineBlock(_timestamp);
        }
    }

    function _mineBlock(uint256 _timestamp) internal {
        uint256 _entryCount = entryCount;
        if (_entryCount == 0) revert NoPlayersInBlock();

        uint256 _currentEpochId = currentEpochId;
        uint256 _lastBlockTimestamp = lastBlockTimestamp;
        uint256 _blockProfit = blockProfit;
        uint256 _shareSum = shareSum;
        uint256 _blockNum = blockNum;

        uint256 timeDiff = _timestamp - _lastBlockTimestamp;
        uint256 blockPercent = (timeDiff * DECIMALS_MULTIPLIER) / BLOCK_TIME;

        if (blockPercent > DECIMALS_MULTIPLIER) {
            uint256 excess = blockPercent - DECIMALS_MULTIPLIER;
            blockPercent = DECIMALS_MULTIPLIER + excess / 5;
        }

        uint256 totalProfit = (_blockProfit * blockPercent) / DECIMALS_MULTIPLIER;

        uint128 tokenPerShare = 0;
        if (_shareSum > 0) {
            tokenPerShare = uint128((totalProfit * REWARD_PRECISION) / _shareSum);
        }

        uint128 ethPerPlayer = 0;
        uint256 totalEthDistributed = 0;

        if (_entryCount >= DIVIDEND_THRESHOLD) {
            uint256 _poolFee = poolFee;
            uint256 totalReward = _poolFee / 3;
            ethPerPlayer = uint128(totalReward / _entryCount);
            totalEthDistributed = uint256(ethPerPlayer) * _entryCount;

            if (totalEthDistributed > 0) {
                unchecked {
                    poolFee = _poolFee - totalEthDistributed;
                }
                emit DividendDistributed(_currentEpochId, _entryCount, totalEthDistributed);
            }
        }

        epochResults[_currentEpochId] = EpochResult({
            tokenPerShare: tokenPerShare,
            ethPerPlayer: ethPerPlayer,
            finalized: true
        });

        emit BlockMined(_currentEpochId, _blockNum, blockPercent, totalProfit);

        unchecked {
            blockNum = _blockNum + blockPercent;
        }

        if (totalProfit > 0) {
            uint256 numerator = _entryCount * ENTRY_FEE * DECIMALS_MULTIPLIER;
            price = numerator / totalProfit;
        }

        unchecked {
            ++currentEpochId;
        }
        entryCount = 0;
        shareSum = 0;
        lastBlockTimestamp = _timestamp;

        _checkHalving();
    }

    function _checkHalving() internal {
        uint256 halfBlockThreshold = HALF_BLOCK_NUM * DECIMALS_MULTIPLIER;
        if (blockNum >= halfBlockThreshold) {
            unchecked {
                round++;
            }
            blockNum = 0;
            blockProfit /= 2;

            emit Halved(round, blockProfit);

            if (round < MAX_ROUND) {
                _withdrawDevFee();
                if (round == MAX_ROUND - 1) {
                    allocateNum = 2;
                }
            }
        }
    }

    function _withdrawDevFee() internal {
        uint256 _devFee = devFee;
        address _devAddress = devAddress;
        if (_devFee > 0 && _devAddress != address(0)) {
            devFee = 0;
            (bool success, ) = _devAddress.call{ value: _devFee }("");
            if (!success) revert DevFeeTransferFailed();
            emit DevFeeWithdrawn(_devAddress, _devFee);
        }
    }

    function getPlayerCount() external view returns (uint256) {
        return entryCount;
    }

    function getBlockNumValue() external view returns (uint256) {
        return blockNum / DECIMALS_MULTIPLIER;
    }

    function isNewbeeTime() external view returns (bool) {
        return block.timestamp - lastBlockTimestamp < NEWBEE_TIME;
    }

    function canMineBlock() external view returns (bool) {
        return
            (entryCount >= MAX_ENTRY_COUNT) || (block.timestamp - lastBlockTimestamp >= BLOCK_TIME);
    }

    function getPendingReward(
        address player
    ) external view returns (uint256 tokenReward, uint256 ethReward) {
        UserInfo memory user = userInfo[player];
        uint256 _currentEpochId = currentEpochId;
        if (user.epochId == 0 || user.epochId == _currentEpochId || user.claimed) {
            return (0, 0);
        }

        EpochResult memory result = epochResults[user.epochId];
        if (!result.finalized) {
            return (0, 0);
        }

        tokenReward = (uint256(user.share) * uint256(result.tokenPerShare)) / REWARD_PRECISION;
        ethReward = uint256(result.ethPerPlayer);
    }
}

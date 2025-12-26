export const CONTRACT_ABI = [
    "function round() view returns (uint256)",
    "function currentEpochId() view returns (uint256)",
    "function blockNum() view returns (uint256)",
    "function blockProfit() view returns (uint256)",
    "function entryCount() view returns (uint256)",
    "function shareSum() view returns (uint256)",
    "function price() view returns (uint256)",
    "function burnFee() view returns (uint256)",
    "function poolFee() view returns (uint256)",
    "function totalSupply() view returns (uint256)",
    "function totalBurned() view returns (uint256)",
    "function lastBlockTimestamp() view returns (uint256)",
    "function userInfo(address) view returns (uint256 epochId, uint256 share, bool claimed)",
    "function getPendingReward(address player) view returns (uint256 tokenReward, uint256 ethReward)",
    "function isNewbeeTime() view returns (bool)",
    "function play() external payable",
    "function claim() external",
    "function burn(uint256 amount) external",
    "function balanceOf(address account) view returns (uint256)",
    "function decimals() view returns (uint8)",
    "event Claimed(address indexed user, uint256 tokenAmount, uint256 ethAmount, uint256 epochId)",
    "event Burned(address indexed user, uint256 amount, uint256 ethReturned)",
    "error InvalidEntryFee()",
    "error AlreadyJoined()",
    "error OnlyNewbiesAllowed()",
    "error AmountMustBeGreaterThanZero()",
    "error InsufficientBalance()",
    "error PriceNotSet()",
    "error InsufficientBurnFee()",
    "error ETHTransferFailed()",
    "error NoPlayersInBlock()",
    "error EpochNotFinalized()",
    "error DevFeeTransferFailed()"
];

// Replace with the deployed contract address. 
// Since the user didn't provide one, I'll use a placeholder or ask the user to set it.
// For now I will put a placeholder.
// export const CONTRACT_ADDRESS = "0xf2a1992f5d4f843afc9def25b6e700f153420aec"; 
export const CONTRACT_ADDRESS = "0x40067f4a61cDb51b6965DABbD4b0fF5E7D430B71"; 

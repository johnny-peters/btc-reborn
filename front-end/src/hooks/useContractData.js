import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';

export function useContractData(contract, account) {
    const [data, setData] = useState({
        round: 0,
        currentEpochId: 0,
        blockNum: 0,
        blockProfit: 0,
        entryCount: 0,
        shareSum: 0,
        price: 0,
        burnFee: 0,
        poolFee: 0,
        totalSupply: 0,
        totalBurned: 0,
        isNewbeeOnly: false,
        lastBlockTimestamp: 0,
        userEthBalance: 0,
        userTokenBalance: 0,
        userPendingToken: 0,
        userPendingEth: 0,
        userShare: 0,
        userEpochId: 0,
        userClaimed: false
    });
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false); // For auto polling, doesn't affect button state
    const [contractError, setContractError] = useState(null);
    const [initialLoading, setInitialLoading] = useState(false);
    const [initialLoadError, setInitialLoadError] = useState(null);
    const [hasInitialized, setHasInitialized] = useState(false);

    const fetchData = useCallback(async (isAutoRefresh = false, isRetry = false) => {
        if (!contract) {
            console.log("No contract available, skipping data fetch");
            return;
        }

        try {
            // If it's initial load (not auto refresh and hasn't initialized), set initialLoading
            if (!isAutoRefresh && !hasInitialized && !isRetry) {
                setInitialLoading(true);
                setInitialLoadError(null);
            }
            // Only user-triggered refresh sets loading, auto polling uses refreshing
            if (isAutoRefresh) {
                setRefreshing(true);
            } else if (!isRetry) {
                setLoading(true);
            }

            // First check if contract exists (by checking code)
            const provider = contract.runner?.provider;
            if (provider) {
                try {
                    const code = await provider.getCode(contract.target);
                    if (code === '0x' || code === '0x0') {
                        console.warn(`Contract not found at ${contract.target}`);
                        // Contract doesn't exist, reset data to default values
                        setData({
                            round: 0,
                            currentEpochId: 0,
                            blockNum: 0,
                            blockProfit: 0,
                            entryCount: 0,
                            shareSum: 0,
                            price: 0,
                            burnFee: 0,
                            poolFee: 0,
                            totalSupply: 0,
                            totalBurned: 0,
                            isNewbeeOnly: false,
                            lastBlockTimestamp: 0,
                            userEthBalance: 0,
                            userTokenBalance: 0,
                            userPendingToken: 0,
                            userPendingEth: 0,
                            userShare: 0,
                            userEpochId: 0,
                            userClaimed: false
                        });
                        setContractError("Contract not found");
                        return;
                    }
                } catch (checkErr) {
                    console.warn("Failed to check contract code:", checkErr);
                }
            }

            // Batch calls if possible, but for now simple awaits
            // Wrap each call with try-catch for better error handling
            let round;
            try {
                round = await contract.round();
            } catch (roundErr) {
                // If round() call fails, contract method may not exist or network issue
                console.error("Failed to call round():", roundErr);
                // Check if it's a decode error (contract doesn't exist or method doesn't exist)
                if (roundErr.code === 'BAD_DATA' || roundErr.message?.includes('could not decode')) {
                    console.warn("Contract method may not exist or contract not deployed");
                    // Try to get user ETH balance (if account exists)
                    let userEthBalance = '0';
                    if (account && contract?.runner?.provider) {
                        try {
                            const balance = await contract.runner.provider.getBalance(account);
                            userEthBalance = ethers.formatEther(balance);
                        } catch {
                            // Ignore balance fetch error
                        }
                    }
                    // Reset data and return
                    setData({
                        round: 0,
                        currentEpochId: 0,
                        blockNum: 0,
                        blockProfit: 0,
                        entryCount: 0,
                        shareSum: 0,
                        price: 0,
                        burnFee: 0,
                        poolFee: 0,
                        totalSupply: 0,
                        totalBurned: 0,
                        isNewbeeOnly: false,
                        lastBlockTimestamp: 0,
                        userEthBalance: userEthBalance,
                        userTokenBalance: 0,
                        userPendingToken: 0,
                        userPendingEth: 0,
                        userShare: 0,
                        userEpochId: 0,
                        userClaimed: false
                    });
                    return;
                }
                throw roundErr; // Re-throw other errors
            }
            const currentEpochId = await contract.currentEpochId();
            const blockNum = await contract.blockNum();
            const blockProfit = await contract.blockProfit();
            const entryCount = await contract.entryCount();
            const shareSum = await contract.shareSum();
            const price = await contract.price();
            const burnFee = await contract.burnFee();
            const poolFee = await contract.poolFee();
            const totalSupply = await contract.totalSupply();
            const totalBurned = await contract.totalBurned();
            const isNewbeeTime = await contract.isNewbeeTime();
            const lastBlockTimestamp = await contract.lastBlockTimestamp();

            // Calculate NEWBEE ONLY: inNewbeePeriod && entryCount < NEWBEE_THRESHOLD
            const NEWBEE_THRESHOLD = 30;
            const isNewbeeOnly = isNewbeeTime && Number(entryCount) < NEWBEE_THRESHOLD;

            let userEthBalance = BigInt(0);
            let userTokenBalance = BigInt(0);
            let userPendingToken = BigInt(0);
            let userPendingEth = BigInt(0);
            let userShare = BigInt(0);
            let userEpochId = BigInt(0);
            let userClaimed = false;

            if (account) {
                // Get balances
                // For ETH balance we need provider, but we can get it from contract.runner.provider
                const provider = contract.runner.provider;
                userEthBalance = await provider.getBalance(account);
                userTokenBalance = await contract.balanceOf(account);

                // Get user info
                const uInfo = await contract.userInfo(account);
                userEpochId = uInfo.epochId;
                userShare = uInfo.share;
                userClaimed = uInfo.claimed;

                // Get pending rewards
                const pending = await contract.getPendingReward(account);
                userPendingToken = pending.tokenReward;
                userPendingEth = pending.ethReward;
            }

            setData({
                round: Number(round),
                currentEpochId: Number(currentEpochId),
                blockNum: ethers.formatUnits(blockNum, 18), // It's a fixed point number
                blockProfit: ethers.formatUnits(blockProfit, 18),
                entryCount: Number(entryCount),
                shareSum: Number(shareSum),
                price: ethers.formatUnits(price, 18), // ETH per token? Price is usually ETH amount.
                burnFee: ethers.formatEther(burnFee),
                poolFee: ethers.formatEther(poolFee),
                totalSupply: ethers.formatUnits(totalSupply, 18),
                totalBurned: ethers.formatUnits(totalBurned, 18),
                isNewbeeOnly: isNewbeeOnly,
                lastBlockTimestamp: Number(lastBlockTimestamp),
                userEthBalance: ethers.formatEther(userEthBalance),
                userTokenBalance: ethers.formatUnits(userTokenBalance, 18),
                userPendingToken: ethers.formatUnits(userPendingToken, 18),
                userPendingEth: ethers.formatEther(userPendingEth),
                userShare: Number(userShare),
                userEpochId: Number(userEpochId),
                userClaimed
            });

            // After successfully fetching data, clear initial loading state and errors
            if (!isAutoRefresh && !hasInitialized) {
                setInitialLoading(false);
                setInitialLoadError(null);
                setHasInitialized(true);
            }

        } catch (err) {
            console.error("Error fetching data:", err);

            // If initial load fails, set initial load error
            if (!isAutoRefresh && !hasInitialized) {
                setInitialLoading(false);
                setInitialLoadError(err.message || "Failed to load contract data");
            }

            // If contract doesn't exist or network error, reset data
            if (err.code === 'BAD_DATA' || err.code === 'CALL_EXCEPTION' || err.message?.includes('could not decode')) {
                console.warn("Contract call failed, possibly contract doesn't exist on this network");

                // Try to get user ETH balance (if account exists)
                let userEthBalance = '0';
                if (account && contract?.runner?.provider) {
                    try {
                        const balance = await contract.runner.provider.getBalance(account);
                        userEthBalance = ethers.formatEther(balance);
                    } catch {
                        // Ignore balance fetch error
                    }
                }

                setData({
                    round: 0,
                    currentEpochId: 0,
                    blockNum: 0,
                    blockProfit: 0,
                    entryCount: 0,
                    shareSum: 0,
                    price: 0,
                    burnFee: 0,
                    poolFee: 0,
                    totalSupply: 0,
                    totalBurned: 0,
                    isNewbeeOnly: false,
                    lastBlockTimestamp: 0,
                    userEthBalance: userEthBalance,
                    userTokenBalance: 0,
                    userPendingToken: 0,
                    userPendingEth: 0,
                    userShare: 0,
                    userEpochId: 0,
                    userClaimed: false
                });
                setContractError("Contract not found");
            }
        } finally {
            // Set corresponding loading state based on refresh type
            if (isAutoRefresh) {
                setRefreshing(false);
            } else {
                setLoading(false);
            }
        }
    }, [contract, account, hasInitialized]);

    // Method to retry initial load
    const retryInitialLoad = useCallback(async () => {
        setInitialLoadError(null);
        setHasInitialized(false);
        await fetchData(false, true);
    }, [fetchData]);

    // Reset initialization state when contract or account changes
    useEffect(() => {
        setHasInitialized(false);
        setInitialLoading(false);
        setInitialLoadError(null);
    }, [contract, account]);

    useEffect(() => {
        if (contract) {
            // If not initialized yet, perform initial load
            if (!hasInitialized) {
                fetchData(false); // Initial load
            }
            // Set up an interval or event listeners to refresh
            const interval = setInterval(() => {
                fetchData(true); // Auto polling uses refreshing
            }, 10000); // Refresh every 10s
            return () => clearInterval(interval);
        } else {
            // If contract doesn't exist, reset initialization state
            setHasInitialized(false);
            setInitialLoading(false);
        }
    }, [contract, account, fetchData, hasInitialized]); // Depend on fetchData, as it's wrapped with useCallback and depends on contract and account

    return {
        data,
        loading,
        refreshing,
        refresh: () => fetchData(false),
        contractError,
        setContractError,
        initialLoading,
        initialLoadError,
        retryInitialLoad
    };
}

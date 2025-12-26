import React, { useState } from "react";
import { ethers } from "ethers";
import { CONTRACT_ABI } from "../abi";
import { useModal } from "../hooks/useModal";
import { Modal } from "./Modal";
import { useGlobalLoading } from "../contexts/LoadingContext";

// Error message mapping
const ERROR_MESSAGES = {
    InvalidEntryFee: "Entry fee must be exactly 0.001 ETH",
    AlreadyJoined: "You have already joined this epoch",
    OnlyNewbiesAllowed: "Only newbies allowed during protection period",
    AmountMustBeGreaterThanZero: "Amount must be greater than zero",
    InsufficientBalance: "Insufficient balance",
    PriceNotSet: "Price not set yet",
    InsufficientBurnFee: "Insufficient burn fee in contract",
    ETHTransferFailed: "ETH transfer failed",
    NoPlayersInBlock: "No players in block",
    EpochNotFinalized: "Epoch not finalized yet",
    DevFeeTransferFailed: "Dev fee transfer failed",
};

// Parse error message
function parseError(error) {
    // If error already has reason, return directly
    if (error.reason) {
        return error.reason;
    }

    // Try to parse from error data
    if (error.data) {
        try {
            // Create interface to parse error
            const iface = new ethers.Interface(CONTRACT_ABI);
            const decoded = iface.parseError(error.data);
            if (decoded) {
                const errorName = decoded.name;
                return ERROR_MESSAGES[errorName] || errorName;
            }
        } catch {
            // Parse failed, continue trying other methods
        }
    }

    // Try to extract information from error message
    const errorMessage = error.message || "";

    // Check common error patterns
    if (
        errorMessage.includes("user rejected") ||
        errorMessage.includes("User denied")
    ) {
        return "Transaction rejected by user";
    }
    if (errorMessage.includes("insufficient funds")) {
        return "Insufficient funds for transaction";
    }
    if (errorMessage.includes("nonce")) {
        return "Transaction nonce error, please try again";
    }

    // Return original error message
    return errorMessage || "Unknown error occurred";
}

export function UserActions({ data, contract, refresh }) {
    const [burnAmount, setBurnAmount] = useState("");
    const [loading, setLoading] = useState(false);
    const { modalState, showSuccess, showError, hideModal } = useModal();
    const { startLoading, stopLoading } = useGlobalLoading();

    // Check if contract exists
    const checkContractExists = async () => {
        if (!contract) return false;
        try {
            const provider = contract.runner?.provider;
            if (provider) {
                const code = await provider.getCode(contract.target);
                return code !== "0x" && code !== "0x0";
            }
        } catch {
            // Ignore check error
        }
        return false;
    };

    const handlePlay = async () => {
        if (!contract) return;

        // Check if contract exists
        const contractExists = await checkContractExists();
        if (!contractExists) {
            showError(
                "ERROR",
                "Contract not found. Please check your network connection."
            );
            return;
        }

        // Check if ETH balance is sufficient
        const requiredEth = ethers.parseEther("0.001");
        const provider = contract.runner?.provider;
        if (provider && data.userEthBalance) {
            const userBalance = ethers.parseEther(
                data.userEthBalance.toString()
            );
            if (userBalance < requiredEth) {
                showError(
                    "ERROR",
                    "Insufficient ETH balance. You need at least 0.001 ETH to join."
                );
                return;
            }
        }

        try {
            setLoading(true);
            startLoading("Joining game...");
            const tx = await contract.play({
                value: requiredEth,
            });
            startLoading("Waiting for transaction confirmation...");
            await tx.wait();
            // Wait for several block confirmations before refreshing data
            await new Promise((resolve) => setTimeout(resolve, 2000));
            await refresh();
            showSuccess("SUCCESS", "Successfully joined the game!");
        } catch (err) {
            console.error(err);
            const errorMsg = parseError(err);
            showError("ERROR", "Failed to join: " + errorMsg);
        } finally {
            setLoading(false);
            stopLoading();
        }
    };

    const handleClaim = async () => {
        if (!contract) return;

        // Check if contract exists
        const contractExists = await checkContractExists();
        if (!contractExists) {
            showError(
                "ERROR",
                "Contract not found. Please check your network connection."
            );
            return;
        }

        try {
            setLoading(true);
            startLoading("Claiming rewards...");
            const tx = await contract.claim();
            startLoading("Waiting for transaction confirmation...");
            await tx.wait();
            // Wait for several block confirmations before refreshing data
            await new Promise((resolve) => setTimeout(resolve, 2000));
            await refresh();
            showSuccess("SUCCESS", "Rewards claimed successfully!");
        } catch (err) {
            console.error(err);
            const errorMsg = parseError(err);
            showError("ERROR", "Failed to claim: " + errorMsg);
        } finally {
            setLoading(false);
            stopLoading();
        }
    };

    const handleBurnAmountChange = (e) => {
        const value = e.target.value;
        // Allow empty string (for clearing input)
        if (value === "") {
            setBurnAmount("");
            return;
        }
        // Only allow numbers and decimal point
        if (!/^\d*\.?\d*$/.test(value)) {
            return;
        }
        // Only update state if input value is greater than 0
        const numValue = parseFloat(value);
        if (numValue > 0 || value === "" || value === "0" || value === ".") {
            // Allow these values during input, but final validation will be done on submit
            setBurnAmount(value);
        }
    };

    const handleBurn = async () => {
        if (!contract || !burnAmount) return;
        const numValue = parseFloat(burnAmount);
        if (numValue <= 0 || isNaN(numValue)) {
            showError("ERROR", "Please enter a valid amount");
            return;
        }

        // Check if contract exists
        const contractExists = await checkContractExists();
        if (!contractExists) {
            showError(
                "ERROR",
                "Contract not found. Please check your network connection."
            );
            return;
        }

        // Check if token balance is sufficient
        const userTokenBalance = parseFloat(data.userTokenBalance || 0);
        if (userTokenBalance < numValue) {
            showError(
                "ERROR",
                `Insufficient BTCR balance. You have ${userTokenBalance.toFixed(2)} BTCR.`
            );
            return;
        }

        try {
            setLoading(true);
            startLoading("Redeeming tokens...");
            const amountWei = ethers.parseUnits(burnAmount, 18);
            const tx = await contract.burn(amountWei);
            startLoading("Waiting for transaction confirmation...");
            await tx.wait();
            // Wait for several block confirmations before refreshing data
            await new Promise((resolve) => setTimeout(resolve, 2000));
            await refresh();
            setBurnAmount("");
            showSuccess("SUCCESS", "Tokens redeemed successfully!");
        } catch (err) {
            console.error(err);
            const errorMsg = parseError(err);
            showError("ERROR", "Redemption failed: " + errorMsg);
        } finally {
            setLoading(false);
            stopLoading();
        }
    };

    const hasPendingToken = parseFloat(data.userPendingToken) > 0;
    const hasToken = parseFloat(data.userTokenBalance) > 0;

    // Determine if user is in current epoch
    const isInCurrentEpoch =
        data.userEpochId > 0 && data.userEpochId === data.currentEpochId;

    // Share in current epoch (0 if not in current epoch)
    const currentEpochShare = isInCurrentEpoch ? data.userShare : 0;

    // Determine if can join based on Share: Share == 0 can join, Share != 0 already joined
    const hasJoined = currentEpochShare > 0;

    // Calculate maximum supported token amount (burnFee/price)
    const maxTokens =
        parseFloat(data.price) > 0
            ? parseFloat(data.burnFee) / parseFloat(data.price)
            : 0;

    return (
        <div
            className="pixel-border"
            style={{ padding: "20px", marginTop: "20px" }}
        >
            <h2 style={{ fontSize: "16px", marginBottom: "20px" }}>
                YOUR PORTFOLIO
            </h2>

            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr 1fr",
                    gap: "20px",
                    marginBottom: "30px",
                }}
            >
                <div>
                    <div style={{ fontSize: "12px", color: "#888" }}>
                        Current Epoch Share
                    </div>
                    <div
                        style={{ fontSize: "16px", color: "var(--neon-pink)" }}
                    >
                        {currentEpochShare} SHARE
                    </div>
                </div>
                <div>
                    <div style={{ fontSize: "12px", color: "#888" }}>
                        BTCR Balance
                    </div>
                    <div
                        style={{
                            fontSize: "16px",
                            color: "var(--neon-orange)",
                        }}
                    >
                        {parseFloat(data.userTokenBalance).toFixed(2)} BTCR
                    </div>
                </div>
                <div>
                    <div style={{ fontSize: "12px", color: "#888" }}>
                        ETH Balance
                    </div>
                    <div
                        style={{ fontSize: "16px", color: "var(--neon-blue)" }}
                    >
                        {parseFloat(data.userEthBalance).toFixed(4)} ETH
                    </div>
                </div>
            </div>
            <div
                style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "20px",
                }}
            >
                {/* Play Section */}
                <button
                    onClick={handlePlay}
                    disabled={loading || hasJoined}
                    style={{ width: "100%", marginBottom: "10px" }}
                    data-text={
                        loading
                            ? "PROCESSING..."
                            : hasJoined
                              ? "JOINED"
                              : "JOIN GAME"
                    }
                >
                    {loading
                        ? "PROCESSING..."
                        : hasJoined
                          ? "JOINED"
                          : "JOIN GAME"}
                </button>

                {/* Claim Section - Purple */}
                {hasPendingToken && (
                    <div
                        style={{
                            padding: "15px",
                            border: "1px dashed var(--neon-pink)",
                            background: "rgba(255, 0, 255, 0.05)",
                        }}
                    >
                        <div style={{ marginBottom: "10px", fontSize: "14px" }}>
                            Available Rewards(
                            <span style={{ color: "var(--neon-blue)" }}>
                                Epoch {data.userEpochId}
                            </span>
                            ):
                            <span style={{ color: "var(--neon-orange)" }}>
                                {" "}
                                {parseFloat(data.userPendingToken).toFixed(
                                    2
                                )}{" "}
                                BTCR
                            </span>{" "}
                            +
                            <span style={{ color: "var(--neon-blue)" }}>
                                {" "}
                                {parseFloat(data.userPendingEth).toFixed(5)} ETH
                            </span>
                        </div>
                        <button
                            onClick={handleClaim}
                            disabled={loading}
                            style={{
                                width: "100%",
                            }}
                            data-text={loading ? "PROCESSING..." : "CLAIM NOW"}
                        >
                            {loading ? "PROCESSING..." : "CLAIM NOW"}
                        </button>
                    </div>
                )}

                {/* Burn Section - Red */}
                {hasToken && (
                    <div
                        style={{
                            padding: "15px",
                            border: "1px dashed #ff0000",
                            background: "rgba(255, 0, 0, 0.05)",
                        }}
                    >
                        <div
                            style={{
                                marginBottom: "10px",
                                fontSize: "14px",
                                color: "#ff0000",
                            }}
                        >
                            Redeem for ETH ({parseFloat(data.price).toFixed(5)}{" "}
                            ETH/BTCR, max {maxTokens.toFixed(2)} BTCR)
                        </div>
                        <div
                            style={{
                                display: "flex",
                                gap: "10px",
                                flexWrap: "wrap",
                            }}
                        >
                            <input
                                type="text"
                                inputMode="decimal"
                                placeholder="Amount"
                                value={burnAmount}
                                onChange={handleBurnAmountChange}
                                min="0"
                                step="any"
                                style={{
                                    flex: "1 1 150px",
                                    minWidth: "120px",
                                    background: "transparent",
                                    border: "1px solid #ff0000",
                                    color: "#ff0000",
                                    padding: "10px",
                                    fontFamily: "inherit",
                                }}
                            />
                            <button
                                onClick={handleBurn}
                                disabled={
                                    !burnAmount ||
                                    parseFloat(burnAmount) <= 0 ||
                                    isNaN(parseFloat(burnAmount)) ||
                                    loading
                                }
                                style={{
                                    flex: "0 0 auto",
                                    minWidth: "120px",
                                    width: "auto",
                                    maxWidth: "none",
                                    margin: 0,
                                    borderColor: "#ff0000",
                                }}
                                data-text="REDEEM"
                            >
                                REDEEM
                            </button>
                        </div>
                    </div>
                )}
            </div>
            <Modal
                isOpen={modalState.isOpen}
                onClose={hideModal}
                title={modalState.title}
                type={modalState.type}
            >
                {modalState.message}
            </Modal>
        </div>
    );
}

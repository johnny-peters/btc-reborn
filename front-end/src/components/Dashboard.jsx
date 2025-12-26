import React, { useState, useEffect } from "react";

const StatBox = ({ label, value, unit = "", color = "var(--neon-orange)" }) => (
    <div
        style={{
            padding: "15px",
            display: "flex",
            flexDirection: "column",
            gap: "5px",
            border: "1px solid rgba(255, 157, 0, 0.3)",
            background: "rgba(0,0,0,0.3)",
        }}
    >
        <span
            style={{
                fontSize: "10px",
                color: "#888",
                textTransform: "uppercase",
            }}
        >
            {label}
        </span>
        <span
            style={{
                fontSize: "18px",
                color: color,
                textShadow: `0 0 5px ${color}`,
            }}
        >
            {value} <span style={{ fontSize: "12px" }}>{unit}</span>
        </span>
    </div>
);

// Block Countdown Component
const BlockCountdown = ({ lastBlockTimestamp }) => {
    const BLOCK_TIME = 600; // 10 minutes = 600 seconds
    const [countdown, setCountdown] = useState(0);

    useEffect(() => {
        const updateCountdown = () => {
            if (!lastBlockTimestamp || lastBlockTimestamp === 0) {
                setCountdown(0);
                return;
            }

            const currentTimestamp = Math.floor(Date.now() / 1000);
            const timeElapsed = currentTimestamp - lastBlockTimestamp;
            const remaining = BLOCK_TIME - timeElapsed;
            setCountdown(Math.max(0, Math.floor(remaining)));
        };

        // Update immediately once
        updateCountdown();

        // Update every second
        const interval = setInterval(updateCountdown, 1000);

        return () => clearInterval(interval);
    }, [lastBlockTimestamp]);

    return (
        <StatBox
            label="Block Countdown"
            value={countdown}
            unit="S"
            color={
                countdown <= 30
                    ? "var(--neon-red)"
                    : countdown <= 60
                      ? "#ffaa00"
                      : "var(--neon-orange)"
            }
        />
    );
};

export function Dashboard({ data }) {
    return (
        <>
            <div
                className="pixel-border"
                style={{ padding: "20px", margin: "30px 0" }}
            >
                <h2
                    style={{
                        fontSize: "16px",
                        marginBottom: "20px",
                        color: "var(--neon-orange)",
                    }}
                >
                    PROTOCOL STATS
                </h2>
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns:
                            "repeat(auto-fit, minmax(200px, 1fr))",
                        gap: "20px",
                    }}
                >
                    <StatBox
                        label="Active Players"
                        value={data.entryCount}
                        color="var(--neon-pink)"
                    />
                    <StatBox label="Epoch Shares" value={data.shareSum} />
                    <StatBox
                        label="Current Epoch"
                        value={data.currentEpochId}
                        color="var(--neon-blue)"
                    />
                    <StatBox
                        label="Blocks Mined"
                        value={isNaN(parseFloat(data.blockNum)) ? "0.00" : parseFloat(data.blockNum).toFixed(2)}
                    />
                    <StatBox label="Halving Round" value={data.round} />
                    <BlockCountdown
                        lastBlockTimestamp={data.lastBlockTimestamp}
                    />
                    <StatBox
                        label="Block Reward"
                        value={isNaN(parseFloat(data.blockProfit)) ? "0.00" : parseFloat(data.blockProfit).toFixed(2)}
                        unit="BTCR"
                    />
                    <StatBox
                        label="Redemption Pool"
                        value={isNaN(parseFloat(data.burnFee)) ? "0.0000" : parseFloat(data.burnFee).toFixed(4)}
                        unit="ETH"
                    />
                    <StatBox
                        label="Reward Pool"
                        value={isNaN(parseFloat(data.poolFee)) ? "0.0000" : parseFloat(data.poolFee).toFixed(4)}
                        unit="ETH"
                    />
                    <StatBox
                        label="NEWBEE ONLY"
                        value={data.isNewbeeOnly ? "true" : "false"}
                        color={
                            data.isNewbeeOnly
                                ? "var(--neon-green)"
                                : "var(--neon-red)"
                        }
                    />
                </div>
            </div>
            <div
                className="pixel-border"
                style={{ padding: "20px", margin: "30px 0" }}
            >
                <h2
                    style={{
                        fontSize: "16px",
                        marginBottom: "20px",
                        color: "var(--neon-orange)",
                    }}
                >
                    TOKEN ECONOMICS
                </h2>
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns:
                            "repeat(auto-fit, minmax(200px, 1fr))",
                        gap: "20px",
                    }}
                >
                    <StatBox
                        label="Total Supply"
                        value={isNaN(parseFloat(data.totalSupply)) ? "0.00" : parseFloat(data.totalSupply).toFixed(2)}
                        unit="BTCR"
                        color="var(--neon-green)"
                    />
                    <StatBox
                        label="Burned"
                        value={isNaN(parseFloat(data.totalBurned)) ? "0.00" : parseFloat(data.totalBurned).toFixed(2)}
                        unit="BTCR"
                        color="var(--neon-red)"
                    />
                </div>
            </div>
        </>
    );
}

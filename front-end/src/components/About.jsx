import React from "react";
import { CONTRACT_ADDRESS } from "../abi";
import { useModal } from "../hooks/useModal";
import { Modal } from "./Modal";

export function About() {
    const { modalState, showSuccess, hideModal } = useModal();

    const copyAddress = () => {
        navigator.clipboard.writeText(CONTRACT_ADDRESS);
        showSuccess("SUCCESS", "Contract address copied to clipboard!");
    };

    const getExplorerUrl = (address) => {
        // Auto-detect based on current network, default to Ethereum mainnet here
        // Can be modified to other networks as needed
        return `https://etherscan.io/address/${address}`;
    };

    return (
        <div style={{ marginTop: "40px" }}>
            <div
                className="pixel-border"
                style={{
                    padding: "40px",
                    marginBottom: "30px",
                }}
            >
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "15px",
                        marginBottom: "30px",
                    }}
                >
                    <img
                        src="/icon.png"
                        alt="BTCR Protocol Icon"
                        style={{
                            width: "40px",
                            height: "40px",
                            objectFit: "contain",
                        }}
                    />
                    <h2
                        style={{
                            fontSize: "20px",
                            color: "var(--neon-orange)",
                            margin: 0,
                        }}
                    >
                        WELCOME TO BTCR PROTOCOL
                    </h2>
                </div>

                <div
                    style={{
                        fontSize: "13px",
                        lineHeight: "1.8",
                        color: "#e0e0e0",
                        marginBottom: "30px",
                    }}
                >
                    <p style={{ marginBottom: "20px" }}>
                        <span style={{ color: "var(--neon-blue)" }}>
                            {">>"}{" "}
                        </span>
                        BTCR opensource Protocol brings the Bitcoin mining
                        experience to Ethereum. Join the decentralized mining
                        game where every block matters. Mine BTCR tokens through
                        strategic participation, just like Bitcoin miners
                        compete for block rewards. Experience the thrill of
                        decentralized mining without the hardware.
                    </p>

                    <p style={{ fontSize: "14px" }}>
                        <a
                            href="https://etherscan.io/address/0x40067f4a61cdb51b6965dabbd4b0ff5e7d430b71#code"
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ color: "var(--neon-orange)" }}
                        >
                            Source code
                        </a>
                    </p>

                    <p style={{ marginBottom: "20px" }}>
                        <span style={{ color: "var(--neon-pink)" }}>
                            {">>"}{" "}
                        </span>
                        <strong style={{ color: "var(--neon-orange)" }}>
                            MINING MECHANICS (Bitcoin-Style):
                        </strong>
                        <br />
                        • Join the mining pool by contributing 0.001 ETH
                        <br />
                        • Earn BTCR tokens as block rewards, proportional to
                        your share
                        <br />
                        • Automatic halving every 210,000 blocks (just like
                        Bitcoin!)
                        <br />• Claim your mining rewards anytime
                        <br />• Redeem BTCR tokens for ETH at market price
                    </p>

                    <p style={{ marginBottom: "20px" }}>
                        <span style={{ color: "var(--neon-green)" }}>
                            {">>"}{" "}
                        </span>
                        <strong style={{ color: "var(--neon-orange)" }}>
                            BITCOIN-INSPIRED FEATURES:
                        </strong>
                        <br />
                        • Decentralized mining pool with share-based rewards
                        <br />
                        • Bitcoin-style halving: rewards cut in half every
                        210,000 blocks
                        <br />
                        • Dividend distribution when mining threshold is reached
                        <br />• Fully on-chain and transparent (no hidden
                        mechanics)
                        <br />• Your mining power = your share = your rewards
                    </p>

                    <p style={{ marginBottom: "20px" }}>
                        <span style={{ color: "var(--neon-yellow)" }}>
                            {">>"}{" "}
                        </span>
                        <strong style={{ color: "var(--neon-orange)" }}>
                            SECURITY:
                        </strong>
                        <br />
                        • Fully audited smart contract
                        <br />
                        • No admin keys or centralization risks
                        <br />
                        • Open source and transparent
                        <br />• Your funds, your control
                    </p>
                </div>

                <div
                    style={{
                        borderTop: "1px solid rgba(255, 157, 0, 0.3)",
                        paddingTop: "30px",
                        marginTop: "30px",
                    }}
                >
                    <h3
                        style={{
                            fontSize: "14px",
                            marginBottom: "10px",
                            color: "var(--neon-orange)",
                            textAlign: "center",
                        }}
                    >
                        OFFICIAL CONTRACT ADDRESS
                    </h3>

                    <div
                        style={{
                            fontSize: "11px",
                            color: "var(--neon-pink)",
                            textAlign: "center",
                            marginBottom: "20px",
                        }}
                    >
                        Ethereum mainnet
                    </div>

                    <div
                        style={{
                            marginBottom: "20px",
                            textAlign: "center",
                        }}
                    >
                        <div
                            style={{
                                fontSize: "16px",
                                color: "var(--neon-orange)",
                                wordBreak: "break-all",
                                marginBottom: "25px",
                            }}
                        >
                            {CONTRACT_ADDRESS}
                        </div>
                        <div
                            style={{
                                display: "flex",
                                flexDirection: "row",
                                gap: "20px",
                                justifyContent: "center",
                                alignItems: "center",
                                width: "100%",
                            }}
                        >
                            <button
                                onClick={copyAddress}
                                style={{
                                    width: "auto",
                                    maxWidth: "none",
                                    minWidth: "120px",
                                    height: "40px",
                                    fontSize: "10px",
                                    padding: "0 15px",
                                    textAlign: "center",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    lineHeight: "normal",
                                    overflow: "visible",
                                    whiteSpace: "nowrap",
                                    margin: 0,
                                    clipPath:
                                        "polygon(0% 0%, 96.25% 0%, 100% 20%, 100% 100%, 3.75% 100%, 0% 80%)",
                                }}
                                data-text="COPY"
                            >
                                COPY
                            </button>
                            <a
                                href={getExplorerUrl(CONTRACT_ADDRESS)}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                    textDecoration: "none",
                                }}
                            >
                                <button
                                    style={{
                                        width: "auto",
                                        maxWidth: "none",
                                        minWidth: "120px",
                                        height: "40px",
                                        fontSize: "10px",
                                        padding: "0 15px",
                                        textAlign: "center",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        lineHeight: "normal",
                                        overflow: "visible",
                                        whiteSpace: "nowrap",
                                        margin: 0,
                                        clipPath:
                                            "polygon(0% 0%, 96.25% 0%, 100% 20%, 100% 100%, 3.75% 100%, 0% 80%)",
                                    }}
                                    data-text="VIEW"
                                >
                                    VIEW
                                </button>
                            </a>
                        </div>
                    </div>

                    <div
                        style={{
                            fontSize: "13px",
                            color: "#888",
                            textAlign: "center",
                            lineHeight: "1.6",
                        }}
                    >
                        <p>
                            Always verify the contract address before
                            interacting.
                        </p>
                        <p>This is the only official BTCR contract.</p>
                    </div>
                </div>

                <div
                    style={{
                        borderTop: "1px solid rgba(255, 157, 0, 0.3)",
                        paddingTop: "30px",
                        marginTop: "30px",
                    }}
                >
                    <h3
                        style={{
                            fontSize: "14px",
                            marginBottom: "20px",
                            color: "var(--neon-orange)",
                            textAlign: "center",
                        }}
                    >
                        PROTOCOL STATS GUIDE
                    </h3>

                    <div
                        style={{
                            fontSize: "13px",
                            lineHeight: "1.8",
                            color: "#e0e0e0",
                        }}
                    >
                        <p style={{ marginBottom: "15px" }}>
                            <span style={{ color: "var(--neon-pink)" }}>
                                {">>"}{" "}
                            </span>
                            <strong style={{ color: "var(--neon-orange)" }}>
                                Active Players:
                            </strong>{" "}
                            Current number of participants in this mining epoch.
                            Maximum 100 players per epoch.
                        </p>

                        <p style={{ marginBottom: "15px" }}>
                            <span style={{ color: "var(--neon-blue)" }}>
                                {">>"}{" "}
                            </span>
                            <strong style={{ color: "var(--neon-orange)" }}>
                                Epoch Shares:
                            </strong>{" "}
                            Sum of all player shares in current epoch. Your
                            share determines your reward proportion. Share = 10
                            + your BTCR balance (max 50, 2x if block mining
                            triggered).
                        </p>

                        <p style={{ marginBottom: "15px" }}>
                            <span style={{ color: "var(--neon-green)" }}>
                                {">>"}{" "}
                            </span>
                            <strong style={{ color: "var(--neon-orange)" }}>
                                Current Epoch:
                            </strong>{" "}
                            The current mining round ID. Each epoch ends when a
                            block is mined (100 players or 10 minutes).
                        </p>

                        <p style={{ marginBottom: "15px" }}>
                            <span style={{ color: "var(--neon-yellow)" }}>
                                {">>"}{" "}
                            </span>
                            <strong style={{ color: "var(--neon-orange)" }}>
                                Blocks Mined:
                            </strong>{" "}
                            Cumulative blocks mined since last halving. When
                            reaching 210,000 blocks, halving occurs and rewards
                            are cut in half.
                        </p>

                        <p style={{ marginBottom: "15px" }}>
                            <span style={{ color: "var(--neon-pink)" }}>
                                {">>"}{" "}
                            </span>
                            <strong style={{ color: "var(--neon-orange)" }}>
                                Halving Round:
                            </strong>{" "}
                            Current halving cycle (1-6). Each halving reduces
                            block rewards by 50%. Round 1 starts with 50 BTCR
                            per block.
                        </p>

                        <p style={{ marginBottom: "15px" }}>
                            <span style={{ color: "var(--neon-blue)" }}>
                                {">>"}{" "}
                            </span>
                            <strong style={{ color: "var(--neon-orange)" }}>
                                Block Countdown:
                            </strong>{" "}
                            Time remaining until next block mining (in seconds).
                            Block mines when countdown reaches 0 or 100 players
                            join. Color changes: red (≤30s), orange (≤60s),
                            normal (others).
                        </p>

                        <p style={{ marginBottom: "15px" }}>
                            <span style={{ color: "var(--neon-green)" }}>
                                {">>"}{" "}
                            </span>
                            <strong style={{ color: "var(--neon-orange)" }}>
                                Block Reward:
                            </strong>{" "}
                            BTCR tokens distributed per block. Starts at 50
                            BTCR, halves every 210,000 blocks. Rewards are
                            distributed proportionally based on shares.
                        </p>

                        <p style={{ marginBottom: "15px" }}>
                            <span style={{ color: "var(--neon-yellow)" }}>
                                {">>"}{" "}
                            </span>
                            <strong style={{ color: "var(--neon-orange)" }}>
                                Redemption Pool:
                            </strong>{" "}
                            ETH reserved for token redemption. When you burn
                            BTCR tokens, you receive ETH from this pool at
                            market price. 1/3 of entry fees go here.
                        </p>

                        <p style={{ marginBottom: "15px" }}>
                            <span style={{ color: "var(--neon-pink)" }}>
                                {">>"}{" "}
                            </span>
                            <strong style={{ color: "var(--neon-orange)" }}>
                                Reward Pool:
                            </strong>{" "}
                            ETH reserved for dividend distribution. When 80+
                            players join an epoch, 1/3 of this pool is
                            distributed equally among all players. 1/3 of entry
                            fees go here.
                        </p>

                        <p style={{ marginBottom: "15px" }}>
                            <span style={{ color: "var(--neon-blue)" }}>
                                {">>"}{" "}
                            </span>
                            <strong style={{ color: "var(--neon-orange)" }}>
                                NEWBEE ONLY:
                            </strong>{" "}
                            Protection mode status. When true (green), only
                            players with 0 BTCR balance can join during the
                            first 3 minutes after block mining. Prevents
                            experienced players from dominating early.
                        </p>
                    </div>
                </div>
            </div>

            <div
                className="pixel-border"
                style={{
                    padding: "30px",
                    background: "rgba(255, 102, 0, 0.05)",
                    borderColor: "var(--neon-orange)",
                }}
            >
                <h3
                    style={{
                        fontSize: "14px",
                        fontFamily: "Press Start 2P",
                        marginBottom: "15px",
                        color: "var(--neon-orange)",
                        textAlign: "center",
                    }}
                >
                    READY TO PLAY?
                </h3>
                <p
                    style={{
                        fontSize: "14px",
                        color: "#aaa",
                        textAlign: "center",
                        lineHeight: "1.6",
                    }}
                >
                    Connect your wallet and start mining today. Every block
                    mined brings new opportunities, just like Bitcoin.
                </p>
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

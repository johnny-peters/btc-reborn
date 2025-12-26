import React from "react";

export function Header({ account, connect, disconnect }) {
    return (
        <header
            className="header-container"
            style={{
                display: "flex",
                flexDirection: "column",
                gap: "15px",
                padding: "20px 0",
            }}
        >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <h1 style={{ margin: 0, fontSize: "24px" }}>
                    BTC<span style={{ color: "white" }}>Reborn</span>
                </h1>
                <span
                    style={{
                        fontSize: "10px",
                        color: "var(--neon-blue)",
                        border: "1px solid var(--neon-blue)",
                        padding: "2px 4px",
                    }}
                >
                    BTCR
                </span>
            </div>

            <div
                className="header-actions"
                style={{
                    minHeight: "60px",
                    height: "60px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "flex-end",
                    marginTop: "5px",
                }}
            >
                {account ? (
                    <div
                        className="pixel-border"
                        style={{
                            padding: "10px 15px",
                            fontSize: "12px",
                            color: "var(--neon-blue)",
                            display: "flex",
                            alignItems: "center",
                            gap: "10px",
                            flexWrap: "nowrap",
                            minHeight: "40px",
                            height: "40px",
                            whiteSpace: "nowrap",
                        }}
                    >
                        <span>
                            {account.slice(0, 6)}...{account.slice(-4)}
                        </span>
                        <button
                            onClick={disconnect}
                            style={{
                                fontSize: "10px",
                                padding: "5px 10px",
                                height: "auto",
                                lineHeight: "normal",
                                width: "auto",
                                margin: 0,
                                minWidth: "60px",
                            }}
                            data-text="DISCONNECT"
                        >
                            DISCONNECT
                        </button>
                    </div>
                ) : (
                    <button
                        onClick={connect}
                        style={{
                            minHeight: "40px",
                            height: "40px",
                            width: "auto",
                            minWidth: "180px",
                            padding: "0 20px",
                        }}
                    >
                        CONNECT WALLET
                    </button>
                )}
            </div>
        </header>
    );
}

import React from "react";

export function Modal({ isOpen, onClose, title, children, type = "info", onRetry = null }) {
    if (!isOpen) return null;

    // Set color based on type
    const getColor = () => {
        switch (type) {
            case "success":
                return "var(--neon-orange)";
            case "error":
                return "var(--neon-red)";
            case "warning":
                return "var(--neon-yellow)";
            default:
                return "var(--neon-orange)";
        }
    };

    const mainColor = getColor();

    return (
        <div
            style={{
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: "rgba(0, 0, 0, 0.8)",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                zIndex: 10000,
            }}
            onClick={onClose}
        >
            <div
                className="window"
                style={{
                    position: "relative",
                    backgroundColor: "var(--bg-panel)",
                    border: `2px solid ${mainColor}`,
                    boxShadow: `10px 10px 0 rgba(0, 0, 0, 0.5), 0 0 20px ${mainColor}`,
                    display: "flex",
                    flexDirection: "column",
                    minWidth: "300px",
                    maxWidth: "500px",
                    maxHeight: "80vh",
                }}
                onClick={(e) => e.stopPropagation()}
            >
                <div
                    className="title-bar"
                    style={{
                        backgroundColor: mainColor,
                        color: "var(--bg-panel)",
                        padding: "8px 12px",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        cursor: "default",
                    }}
                >
                    <div
                        className="title-text"
                        style={{
                            fontWeight: "bold",
                            textTransform: "uppercase",
                            letterSpacing: "1px",
                            fontSize: "10px",
                        }}
                    >
                        {title}
                    </div>
                    <div
                        className="title-controls"
                        style={{ display: "flex", gap: "5px" }}
                    >
                        <button
                            className="win-btn"
                            onClick={onClose}
                            style={{
                                background: "var(--bg-panel)",
                                color: mainColor,
                                border: `1px solid var(--bg-panel)`,
                                width: "20px",
                                height: "20px",
                                fontFamily: "inherit",
                                fontSize: "12px",
                                lineHeight: "16px",
                                padding: 0,
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                            }}
                            onMouseEnter={(e) => {
                                e.target.style.background = mainColor;
                                e.target.style.color = "var(--bg-panel)";
                                e.target.style.borderColor = "var(--bg-panel)";
                            }}
                            onMouseLeave={(e) => {
                                e.target.style.background = "var(--bg-panel)";
                                e.target.style.color = mainColor;
                                e.target.style.borderColor = "var(--bg-panel)";
                            }}
                        >
                            ×
                        </button>
                    </div>
                </div>
                <div
                    className="window-body"
                    style={{
                        flex: 1,
                        padding: "20px",
                        overflow: "auto",
                        position: "relative",
                        color: mainColor,
                        fontSize: "14px",
                        lineHeight: "1.6",
                    }}
                >
                    {children}
                    {onRetry && (
                        <div
                            style={{
                                marginTop: "20px",
                                display: "flex",
                                justifyContent: "flex-end",
                                gap: "10px",
                            }}
                        >
                            <button
                                onClick={onRetry}
                                style={{
                                    padding: "10px 20px",
                                    backgroundColor: "transparent",
                                    border: `2px solid ${mainColor}`,
                                    color: mainColor,
                                    fontFamily: "inherit",
                                    fontSize: "12px",
                                    cursor: "pointer",
                                    textTransform: "uppercase",
                                    letterSpacing: "1px",
                                }}
                                onMouseEnter={(e) => {
                                    e.target.style.backgroundColor = mainColor;
                                    e.target.style.color = "var(--bg-panel)";
                                }}
                                onMouseLeave={(e) => {
                                    e.target.style.backgroundColor = "transparent";
                                    e.target.style.color = mainColor;
                                }}
                            >
                                RETRY
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

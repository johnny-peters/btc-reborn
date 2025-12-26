import React from "react";

export function GlobalLoading({
    isLoading,
    message = "Processing transaction...",
}) {
    if (!isLoading) return null;

    return (
        <div className="jimu-loader jimu-loader-fullscreen">
            <div
                style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    textAlign: "center",
                    color: "var(--neon-orange)",
                    position: "relative",
                    minHeight: "200px",
                }}
            >
                {/* Loading animation container */}
                <div
                    style={{
                        position: "relative",
                        width: "60px",
                        height: "40px",
                        marginBottom: "30px",
                    }}
                >
                    <div className="jimu-primary-loading"></div>
                </div>
                {/* Message */}
                <div
                    style={{
                        fontSize: "18px",
                        color: "var(--neon-orange)",
                        textShadow: "0 0 10px var(--neon-orange)",
                        letterSpacing: "2px",
                    }}
                >
                    {message}
                </div>
                {/* Sub message */}
                <div
                    style={{
                        fontSize: "18px",
                        color: "#888",
                        marginTop: "10px",
                    }}
                >
                    This may take a moment
                </div>
            </div>
        </div>
    );
}

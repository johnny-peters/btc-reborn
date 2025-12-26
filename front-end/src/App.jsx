import React, { useState, useEffect } from "react";
import { useWeb3 } from "./hooks/useWeb3";
import { useContractData } from "./hooks/useContractData";
import { Header } from "./components/Header";
import { Dashboard } from "./components/Dashboard";
import { UserActions } from "./components/UserActions";
import { About } from "./components/About";
import { LoadingProvider, useGlobalLoading } from "./contexts/LoadingContext";
import { GlobalLoading } from "./components/GlobalLoading";
import { useModal } from "./hooks/useModal";
import { Modal } from "./components/Modal";

function AppContent() {
    const {
        account,
        connect: originalConnect,
        disconnect,
        contract,
        error,
        setError,
        contractInitialized,
        contractInitError,
        retryInitContract,
    } = useWeb3();
    const { 
        data, 
        refresh, 
        contractError, 
        setContractError,
        initialLoading,
        initialLoadError,
        retryInitialLoad,
    } = useContractData(
        contract,
        account
    );
    const [activeTab, setActiveTab] = useState("PLAY");
    const {
        loading: globalLoading,
        loadingMessage,
        startLoading,
        stopLoading,
    } = useGlobalLoading();
    const { modalState, showError, hideModal } = useModal();

    // Initial load: show global loading until successfully fetching public data
    useEffect(() => {
        if (!contractInitialized || initialLoading) {
            startLoading("Loading protocol data...");
        } else {
            stopLoading();
        }
    }, [contractInitialized, initialLoading, startLoading, stopLoading]);

    // Listen to error state, show error modal (with retry button)
    useEffect(() => {
        // Contract initialization error
        if (contractInitError) {
            const retryHandler = async () => {
                hideModal();
                try {
                    await retryInitContract();
                } catch (err) {
                    // Retry failed, error will be set in retryInitContract
                }
            };
            showError("ERROR", `Failed to initialize contract: ${contractInitError}`, retryHandler);
        }
        // Initial data load error
        else if (initialLoadError) {
            const retryHandler = async () => {
                hideModal();
                try {
                    await retryInitialLoad();
                } catch (err) {
                    // Retry failed, error will be set in retryInitialLoad
                }
            };
            showError("ERROR", `Failed to load data: ${initialLoadError}`, retryHandler);
        }
        // Other errors (contractError and error)
        else if (contractError) {
            showError("ERROR", contractError);
        } else if (error) {
            showError("ERROR", error);
        }
    }, [contractInitError, initialLoadError, contractError, error, showError, hideModal, retryInitContract, retryInitialLoad]);

    // Wrap connect function, add loading and wait for user data loading
    const connect = async () => {
        try {
            startLoading("Connecting wallet...");
            await originalConnect();
            
            // Wait for user data to be successfully fetched
            // If connection succeeds, useContractData will automatically refetch data (because account changed)
            // We need to wait for initialLoading to complete
            let retries = 0;
            const maxRetries = 30; // Wait at most 30 seconds (assuming checking every 1 second)
            
            // Wait for initialLoading to start (needs some time after account change)
            await new Promise(resolve => setTimeout(resolve, 100));
            
            while (initialLoading && retries < maxRetries) {
                await new Promise(resolve => setTimeout(resolve, 1000));
                retries++;
            }
            
            // If initial load fails, show error
            if (initialLoadError) {
                stopLoading();
                const retryHandler = async () => {
                    hideModal();
                    try {
                        startLoading("Retrying...");
                        await retryInitialLoad();
                        // Wait for retry to complete
                        let retryRetries = 0;
                        while (initialLoading && retryRetries < 30) {
                            await new Promise(resolve => setTimeout(resolve, 1000));
                            retryRetries++;
                        }
                        stopLoading();
                        if (initialLoadError) {
                            // Retry still failed
                            showError("ERROR", `Failed to load user data: ${initialLoadError}`, retryHandler);
                        }
                    } catch (err) {
                        stopLoading();
                        // Retry failed, error will be set in retryInitialLoad
                    }
                };
                showError("ERROR", `Failed to load user data: ${initialLoadError}`, retryHandler);
            } else {
                stopLoading();
            }
        } catch (err) {
            console.error("Connection error:", err);
            stopLoading();
            const retryHandler = async () => {
                hideModal();
                try {
                    await connect();
                } catch (retryErr) {
                    // Retry failed, error will be set in connect
                }
            };
            showError("ERROR", `Failed to connect wallet: ${err.message}`, retryHandler);
        }
    };

    return (
        <>
            <GlobalLoading isLoading={globalLoading} message={loadingMessage} />
            <div className="scanlines"></div>
            <div className="container">
                <Header
                    account={account}
                    connect={connect}
                    disconnect={disconnect}
                />

                {/* Tab Container with Border */}
                <div
                    style={{
                        marginTop: "30px",
                        padding: "0",
                    }}
                >
                    {/* Tab Navigation */}
                    <div
                        style={{
                            display: "flex",
                            gap: "0",
                            justifyContent: "flex-start",
                            alignItems: "flex-end",
                            width: "100%",
                            borderBottom: "2px solid var(--neon-orange)",
                        }}
                    >
                        <button
                            onClick={() => setActiveTab("PLAY")}
                            className={`tab-button ${activeTab === "PLAY" ? "active" : ""}`}
                            data-text={activeTab === "PLAY" ? "PLAY" : ""}
                        >
                            PLAY
                        </button>
                        <button
                            onClick={() => setActiveTab("ABOUT")}
                            className={`tab-button ${activeTab === "ABOUT" ? "active" : ""}`}
                            data-text={activeTab === "ABOUT" ? "ABOUT" : ""}
                        >
                            ABOUT
                        </button>
                    </div>

                    {/* Tab Content */}
                    <div
                        style={{
                            borderLeft: "2px solid var(--neon-orange)",
                            borderRight: "2px solid var(--neon-orange)",
                            borderBottom: "2px solid var(--neon-orange)",
                            padding: "20px",
                        }}
                    >
                        {activeTab === "PLAY" ? (
                            <>
                                <Dashboard data={data} />

                                <div
                                    style={{
                                        minHeight: "400px",
                                        marginTop: "40px",
                                    }}
                                >
                                    {account ? (
                                        <UserActions
                                            data={data}
                                            contract={contract}
                                            refresh={refresh}
                                        />
                                    ) : (
                                        <div
                                            className="pixel-border"
                                            style={{
                                                padding: "40px",
                                                textAlign: "center",
                                            }}
                                        >
                                            <h2
                                                className="glitch"
                                                style={{ marginBottom: "20px" }}
                                            >
                                                WALLET REQUIRED
                                            </h2>
                                            <p
                                                style={{
                                                    color: "#888",
                                                    marginBottom: "30px",
                                                }}
                                            >
                                                Connect your wallet to start
                                                playing.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </>
                        ) : (
                            <About />
                        )}
                    </div>
                </div>

                <footer
                    style={{
                        marginTop: "50px",
                        textAlign: "center",
                        fontSize: "14px",
                        fontFamily: "Press Start 2P, cursive",
                        color: "#555",
                    }}
                >
                    Salute Satoshi Nakamoto • BTCR
                </footer>
            </div>
            <Modal
                isOpen={modalState.isOpen}
                onClose={() => {
                    setError(null);
                    setContractError(null);
                    hideModal();
                }}
                title={modalState.title}
                type={modalState.type}
                onRetry={modalState.onRetry}
            >
                {modalState.message}
            </Modal>
        </>
    );
}

function App() {
    return (
        <LoadingProvider>
            <AppContent />
        </LoadingProvider>
    );
}

export default App;

import { useState, useEffect, useCallback, useRef } from 'react';
import { ethers } from 'ethers';
import { CONTRACT_ABI, CONTRACT_ADDRESS } from '../abi';

// Public RPC nodes (mainnet)
const MAINNET_RPC_URLS = [
  'https://ethereum-rpc.publicnode.com',
  'https://eth.llamarpc.com',
  'https://eth-mainnet.g.alchemy.com/v2/nLjKGOEGCg8aLzzFBxI_e',
  'https://rpc.ankr.com/eth',
];

// Create public RPC Provider (async to test connectivity)
const createPublicProvider = async (index = 0) => {
  // Try to use the first available RPC URL
  try {
    console.log('createPublicProvider', MAINNET_RPC_URLS[index]);
    const provider = new ethers.JsonRpcProvider(MAINNET_RPC_URLS[index]);

    // Test the provider by calling getNetwork
    try {
      await provider.getNetwork();
      return provider;
    } catch (networkErr) {
      // Provider creation succeeded but network call failed, try next URL
      console.error('Failed to get network from provider(' + MAINNET_RPC_URLS[index] + '):', networkErr);
      if (index >= MAINNET_RPC_URLS.length - 1) {
        console.error('All public RPC providers failed');
        return null;
      }
      return createPublicProvider(index + 1);
    }
  } catch (err) {
    // Provider creation failed, try next URL
    console.error('Failed to create public provider(' + MAINNET_RPC_URLS[index] + '):', err);
    if (index >= MAINNET_RPC_URLS.length - 1) {
      console.error('All public RPC providers failed', err);
      return null;
    }
    return createPublicProvider(index + 1);
  }
};

export function useWeb3() {
  const [account, setAccount] = useState(null);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [contract, setContract] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [error, setError] = useState(null);
  const [contractInitialized, setContractInitialized] = useState(false);
  const [contractInitError, setContractInitError] = useState(null);
  // 使用 useRef 来跟踪初始化状态，避免 StrictMode 下的重复调用
  const initRef = useRef(false);
  // const targetChainId = 11155111; // sepolia chain id
  const targetChainId = 1; // mainnet chain id
  const checkChainId = useCallback(async () => {
    const network = await new ethers.BrowserProvider(window.ethereum).getNetwork();
    const chainId = network.chainId;
    const chainIdNumber = Number(chainId);
    console.log("chainIdNumber", chainIdNumber);
    if (chainIdNumber && (chainIdNumber !== targetChainId)) {
      setError("Please switch to Mainnet network, current chain id: " + chainIdNumber);
      return false;
    }
    return true;
  }, [targetChainId]);

  const connect = useCallback(async () => {
    if (window.ethereum) {
      try {
        const browserProvider = new ethers.BrowserProvider(window.ethereum);

        // Request account authorization, if user has already authorized, MetaMask will return account directly
        // If user revoked authorization when disconnecting, a confirmation dialog will pop up here
        await browserProvider.send("eth_requestAccounts", []);

        const network = await browserProvider.getNetwork();

        const signerInstance = await browserProvider.getSigner();
        // Check chain ID
        const isCorrectChain = await checkChainId();
        if (!isCorrectChain) {
          setError("Please switch to Mainnet network");
          return;
        }
        // Clear previous error state
        setError(null);
        // Get current selected account address directly from signer
        // This is the most reliable method, as signer always corresponds to MetaMask's currently selected account
        const currentAccount = await signerInstance.getAddress();

        console.log("Connected account:", currentAccount);

        if (!currentAccount) {
          setError("No accounts found. Please connect your wallet.");
          return;
        }

        setProvider(browserProvider);
        setSigner(signerInstance);
        setAccount(currentAccount);
        setChainId(network.chainId);

        // Initialize contract
        const contractInstance = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signerInstance);
        setContract(contractInstance);

        setError(null);
      } catch (err) {
        console.error("Connection error:", err);
        setError(err.message);
      }
    } else {
      setError("Please install MetaMask!");
    }
  }, [checkChainId]);

  // Function to initialize contract
  const initReadOnlyContract = useCallback(async () => {
    setContractInitError(null);
    let readOnlyProvider = null;
    let networkChainId = null;

    try {
      // Prefer using window.ethereum (if available and network is correct)
      if (window.ethereum) {
        try {
          const browserProvider = new ethers.BrowserProvider(window.ethereum);
          const network = await browserProvider.getNetwork();
          networkChainId = Number(network.chainId);

          // Check chain ID
          const isCorrectChain = await checkChainId();
          if (isCorrectChain) {
            readOnlyProvider = browserProvider;
          }
        } catch (err) {
          console.warn("Failed to use browser provider:", err);
        }
      }

      // If window.ethereum is unavailable or network is incorrect, use public RPC
      if (!readOnlyProvider) {
        try {
          readOnlyProvider = await createPublicProvider();
          if (readOnlyProvider) {
            const network = await readOnlyProvider.getNetwork();
            networkChainId = Number(network.chainId);
            console.log("Using public RPC provider for mainnet");
          }
        } catch (err) {
          console.error("Failed to create public provider:", err);
          throw new Error("Failed to create public RPC provider");
        }
      }

      if (!readOnlyProvider) {
        throw new Error("No provider available");
      }

      // Create read-only contract instance (using provider instead of signer)
      const readOnlyContract = new ethers.Contract(
        CONTRACT_ADDRESS,
        CONTRACT_ABI,
        readOnlyProvider
      );

      setContract((prevContract) => {
        // If contract instance already exists, check if it has signer (can send transactions)
        // If it has signer, don't override; otherwise create read-only contract
        if (prevContract) {
          // Check if runner is signer (can check by checking if sendTransaction method exists)
          const runner = prevContract.runner;
          if (runner && typeof runner.sendTransaction === 'function') {
            // This is a contract with signer, don't override
            return prevContract;
          }
        }
        return readOnlyContract;
      });
      setProvider((prevProvider) => prevProvider || readOnlyProvider);
      if (networkChainId) {
        setChainId(networkChainId);
      }

      // Successfully initialized
      setContractInitialized(true);
      setContractInitError(null);
    } catch (err) {
      console.error("Failed to initialize read-only contract:", err);
      setContractInitError(err.message || "Failed to initialize contract");
      setContractInitialized(false);
      throw err;
    }
  }, [checkChainId]);

  // Method to retry contract initialization
  const retryInitContract = useCallback(async () => {
    setContractInitError(null);
    await initReadOnlyContract();
  }, [initReadOnlyContract]);

  useEffect(() => {
    // Initialize: Create read-only contract instance to read public data even without wallet connection
    // Only create read-only contract during initialization (if no contract instance and not initialized yet)
    // 使用 ref 确保即使在 StrictMode 下也只初始化一次
    if (!contract && !contractInitialized && !initRef.current) {
      initRef.current = true;
      initReadOnlyContract().catch(() => {
        // Error is already handled in initReadOnlyContract
      });
    }

    if (window.ethereum) {
      const handleAccountsChanged = async (accounts) => {
        if (accounts.length > 0) {
          const newAccount = accounts[0];
          // If account hasn't changed, no need to reinitialize
          if (account && account.toLowerCase() === newAccount.toLowerCase()) {
            return;
          }

          // Account changed, reinitialize signer and contract
          try {
            const browserProvider = new ethers.BrowserProvider(window.ethereum);
            const network = await browserProvider.getNetwork();

            // Check chain ID
            const isCorrectChain = await checkChainId();
            if (!isCorrectChain) {
              setAccount(null);
              setSigner(null);
              setContract(null);
              return;
            }

            const signerInstance = await browserProvider.getSigner();
            const contractInstance = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signerInstance);

            setProvider(browserProvider);
            setSigner(signerInstance);
            setAccount(newAccount);
            setChainId(network.chainId);
            setContract(contractInstance);
          } catch (err) {
            console.error("Failed to reinitialize on accountsChanged:", err);
            // If reinitialization fails, refresh page as fallback
            window.location.reload();
          }
        } else {
          setAccount(null);
          setSigner(null);
          // Recreate read-only contract instance to continue displaying public data
          // Use public RPC as fallback
          const initFallbackContract = async () => {
            let readOnlyProvider = null;
            if (window.ethereum) {
              try {
                const browserProvider = new ethers.BrowserProvider(window.ethereum);
                const isCorrectChain = await checkChainId();
                if (isCorrectChain) {
                  readOnlyProvider = browserProvider;
                }
              } catch (err) {
                console.warn("Failed to use browser provider:", err);
              }
            }
            if (!readOnlyProvider) {
              readOnlyProvider = await createPublicProvider();
            }
            if (readOnlyProvider) {
              try {
                const readOnlyContract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, readOnlyProvider);
                setContract(readOnlyContract);
                setProvider(readOnlyProvider);
              } catch (err) {
                console.error("Failed to create fallback contract:", err);
              }
            }
          };
          initFallbackContract();
        }
      };

      const handleChainChanged = async () => {
        console.log("chainChanged");
        // Clear state
        setAccount(null);
        setSigner(null);
        setContract(null);
        setError(null);

        // Check new chain ID and reinitialize
        try {
          let readOnlyProvider = null;
          let networkChainId = null;

          if (window.ethereum) {
            try {
              const browserProvider = new ethers.BrowserProvider(window.ethereum);
              const network = await browserProvider.getNetwork();
              networkChainId = Number(network.chainId);
              const isCorrectChain = await checkChainId();

              if (isCorrectChain) {
                readOnlyProvider = browserProvider;
              }
            } catch (err) {
              console.warn("Failed to use browser provider:", err);
            }
          }

          // If network is incorrect or window.ethereum is unavailable, use public RPC
          if (!readOnlyProvider) {
            readOnlyProvider = await createPublicProvider();
            if (readOnlyProvider) {
              const network = await readOnlyProvider.getNetwork();
              networkChainId = Number(network.chainId);
              console.log("Using public RPC provider after chain change");
            }
          }

          if (readOnlyProvider) {
            // Create read-only contract instance
            const readOnlyContract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, readOnlyProvider);
            setContract(readOnlyContract);
            setProvider(readOnlyProvider);
            if (networkChainId) {
              setChainId(networkChainId);
            }
          } else {
            setContract(null);
          }
        } catch (err) {
          console.error("Failed to reinitialize on chainChanged:", err);
          // If reinitialization fails, try using public RPC
          try {
            const publicProvider = await createPublicProvider();
            if (publicProvider) {
              const readOnlyContract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, publicProvider);
              setContract(readOnlyContract);
              setProvider(publicProvider);
            }
          } catch (fallbackErr) {
            console.error("Failed to use public RPC as fallback:", fallbackErr);
          }
        }
      };

      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);

      // Cleanup function: remove event listeners
      return () => {
        if (window.ethereum) {
          window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
          window.ethereum.removeListener('chainChanged', handleChainChanged);
        }
      };
    }
  }, [contract, account, checkChainId, contractInitialized, initReadOnlyContract]);

  const disconnect = useCallback(async () => {
    // Clear local state
    setAccount(null);
    setSigner(null);

    // Recreate read-only contract instance to continue displaying public data
    let readOnlyProvider = null;

    // Prefer using window.ethereum (if available and network is correct)
    if (window.ethereum) {
      try {
        const browserProvider = new ethers.BrowserProvider(window.ethereum);
        const isCorrectChain = await checkChainId();
        if (isCorrectChain) {
          readOnlyProvider = browserProvider;
        }
      } catch (err) {
        console.warn("Failed to use browser provider:", err);
      }
    }

    // If window.ethereum is unavailable or network is incorrect, use public RPC
    if (!readOnlyProvider) {
      readOnlyProvider = await createPublicProvider();
    }

    if (readOnlyProvider) {
      try {
        const readOnlyContract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, readOnlyProvider);
        setContract(readOnlyContract);
        setProvider(readOnlyProvider);
      } catch (err) {
        console.error("Failed to create read-only contract:", err);
        setContract(null);
      }
    } else {
      setContract(null);
    }

    // Try to revoke MetaMask authorization so confirmation dialog will pop up next time connecting
    if (window.ethereum) {
      try {
        // First get current permissions
        const permissions = await window.ethereum.request({
          method: 'wallet_getPermissions'
        });

        // If eth_accounts permission exists, revoke it
        const ethAccountsPermission = permissions.find(
          perm => perm.parentCapability === 'eth_accounts'
        );

        if (ethAccountsPermission) {
          await window.ethereum.request({
            method: 'wallet_revokePermissions',
            params: [{
              eth_accounts: {}
            }]
          });
        }
      } catch (err) {
        // If revocation fails (possibly due to different permission structure or MetaMask version), ignore error
        // This won't affect local state clearing
        console.log("Could not revoke permissions (this is normal):", err);
      }
    }
  }, [checkChainId]);

  return {
    account,
    provider,
    signer,
    contract,
    chainId,
    connect,
    disconnect,
    error,
    setError,
    contractInitialized,
    contractInitError,
    retryInitContract
  };
}

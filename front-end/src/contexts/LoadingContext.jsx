import React, { createContext, useContext, useState, useCallback } from 'react';

const LoadingContext = createContext(null);

export function LoadingProvider({ children }) {
    const [loading, setLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState('Processing transaction...');

    const startLoading = useCallback((message = 'Processing transaction...') => {
        setLoadingMessage(message);
        setLoading(true);
    }, []);

    const stopLoading = useCallback(() => {
        setLoading(false);
        setLoadingMessage('Processing transaction...');
    }, []);

    return (
        <LoadingContext.Provider value={{ loading, loadingMessage, startLoading, stopLoading }}>
            {children}
        </LoadingContext.Provider>
    );
}

export function useGlobalLoading() {
    const context = useContext(LoadingContext);
    if (!context) {
        throw new Error('useGlobalLoading must be used within LoadingProvider');
    }
    return context;
}


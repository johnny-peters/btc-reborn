import { useState, useCallback } from 'react';

export function useModal() {
    const [modalState, setModalState] = useState({
        isOpen: false,
        title: '',
        message: '',
        type: 'info', // 'info', 'success', 'error', 'warning'
        onRetry: null, // Retry callback function
    });

    const showModal = useCallback((title, message, type = 'info', onRetry = null) => {
        setModalState({
            isOpen: true,
            title,
            message,
            type,
            onRetry,
        });
    }, []);

    const hideModal = useCallback(() => {
        setModalState(prev => ({
            ...prev,
            isOpen: false,
        }));
    }, []);

    const showSuccess = useCallback((title, message) => {
        showModal(title, message, 'success');
    }, [showModal]);

    const showError = useCallback((title, message, onRetry = null) => {
        showModal(title, message, 'error', onRetry);
    }, [showModal]);

    const showWarning = useCallback((title, message) => {
        showModal(title, message, 'warning');
    }, [showModal]);

    const showInfo = useCallback((title, message) => {
        showModal(title, message, 'info');
    }, [showModal]);

    return {
        modalState,
        showModal,
        hideModal,
        showSuccess,
        showError,
        showWarning,
        showInfo,
    };
}


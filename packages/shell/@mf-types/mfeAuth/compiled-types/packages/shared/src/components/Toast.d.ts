import React from 'react';
type ToastType = 'success' | 'error';
interface ToastContextValue {
    showToast: (message: string, type?: ToastType) => void;
}
export declare const ToastProvider: React.FC<{
    children: React.ReactNode;
}>;
export declare function useToast(): ToastContextValue;
export {};

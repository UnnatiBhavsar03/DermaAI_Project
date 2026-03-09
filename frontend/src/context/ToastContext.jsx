import React, { createContext, useContext, useState, useEffect } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

const ToastContext = createContext();

export const useToast = () => useContext(ToastContext);

export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);

    const addToast = (message, type = 'info', duration = 3000) => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type }]);

        if (duration) {
            setTimeout(() => {
                removeToast(id);
            }, duration);
        }
    };

    const removeToast = (id) => {
        setToasts(prev => prev.filter(toast => toast.id !== id));
    };

    const icons = {
        success: <CheckCircle className="w-5 h-5 text-teal-600" />,
        error: <AlertCircle className="w-5 h-5 text-red-500" />,
        info: <Info className="w-5 h-5 text-blue-500" />,
        warning: <AlertTriangle className="w-5 h-5 text-yellow-500" />
    };

    const styles = {
        success: 'bg-teal-50/70 text-teal-900 border-teal-200/50',
        error: 'bg-red-50/70 text-red-900 border-red-200/50',
        info: 'bg-blue-50/70 text-blue-900 border-blue-200/50',
        warning: 'bg-yellow-50/70 text-yellow-900 border-yellow-200/50'
    };

    return (
        <ToastContext.Provider value={{ addToast, removeToast }}>
            {children}
            <div className="fixed top-5 right-5 z-[9999] flex flex-col gap-3 w-full max-w-sm pointer-events-none">
                {toasts.map(toast => (
                    <div
                        key={toast.id}
                        className={`
                            pointer-events-auto flex items-center gap-4 px-6 py-4 rounded-full shadow-2xl border border-white/40 backdrop-blur-2xl transition-all duration-500 animate-slide-in-right transform hover:scale-[1.02]
                            ${styles[toast.type] || styles.info}
                        `}
                    >
                        <div className="flex-shrink-0">
                            {icons[toast.type] || icons.info}
                        </div>
                        <div className="flex-1 text-sm font-semibold tracking-wide">
                            {toast.message}
                        </div>
                        <button
                            onClick={() => removeToast(toast.id)}
                            className="bg-white/20 hover:bg-white/40 text-gray-600 transition-colors p-1.5 rounded-full backdrop-blur-sm -mr-2"
                        >
                            <X size={14} strokeWidth={3} />
                        </button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
};

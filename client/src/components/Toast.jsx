// client/src/components/Toast.jsx
import { Toaster } from 'react-hot-toast';

/**
 * Toast notification wrapper component
 * Uses react-hot-toast for beautiful toast notifications
 */
export default function ToastProvider() {
    return (
        <Toaster
            position="top-right"
            reverseOrder={false}
            gutter={8}
            toastOptions={{
                // Default options
                duration: 4000,
                style: {
                    background: '#fff',
                    color: '#363636',
                    padding: '16px',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                },
                // Success toast styling
                success: {
                    duration: 3000,
                    iconTheme: {
                        primary: '#10B981',
                        secondary: '#fff',
                    },
                },
                // Error toast styling
                error: {
                    duration: 5000,
                    iconTheme: {
                        primary: '#EF4444',
                        secondary: '#fff',
                    },
                },
                // Loading toast styling
                loading: {
                    iconTheme: {
                        primary: '#3B82F6',
                        secondary: '#fff',
                    },
                },
            }}
        />
    );
}

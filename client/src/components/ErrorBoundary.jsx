// client/src/components/ErrorBoundary.jsx
import { Component } from 'react';

// ErrorBoundary component to catch JavaScript errors anywhere in the child component tree
// It logs errors and displays a fallback UI instead of crashing the whole app
class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    // Lifecycle method called when an error is thrown in a descendant component
    // Updates state so the next render will show the fallback UI
    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    // Lifecycle method called after an error has been thrown
    // Used for logging error information
    componentDidCatch(error, errorInfo) {
        console.error('Error caught by boundary:', error, errorInfo);
        this.setState({
            error,
            errorInfo
        });
    }

    render() {
        if (this.state.hasError) {
            // Render fallback UI if an error occurred
            return (
                <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
                    <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
                        <div className="text-center">
                            <div className="text-red-500 text-6xl mb-4">⚠️</div>
                            <h1 className="text-2xl font-bold text-gray-800 mb-2">
                                Oops! Something went wrong
                            </h1>
                            <p className="text-gray-600 mb-6">
                                We're sorry for the inconvenience. Please try refreshing the page.
                            </p>

                            {/* Show detailed error info in development mode */}
                            {process.env.NODE_ENV === 'development' && this.state.error && (
                                <details className="text-left bg-gray-50 rounded p-4 mb-4">
                                    <summary className="cursor-pointer font-semibold text-sm text-gray-700 mb-2">
                                        Error Details
                                    </summary>
                                    <pre className="text-xs text-red-600 overflow-auto">
                                        {this.state.error.toString()}
                                        {this.state.errorInfo?.componentStack}
                                    </pre>
                                </details>
                            )}

                            <button
                                onClick={() => window.location.reload()}
                                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition duration-200"
                            >
                                Refresh Page
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        // Render children normally if no error
        return this.props.children;
    }
}

export default ErrorBoundary;

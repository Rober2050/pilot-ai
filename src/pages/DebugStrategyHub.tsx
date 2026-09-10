import { Component, ErrorInfo, ReactNode } from 'react';
import StrategyHub from './StrategyHub';

import { loggingService } from '../services/firebase/loggingService';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
        errorInfo: null
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error, errorInfo: null };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);

        // Log to system logs
        loggingService.logError(
            'StrategyHub',
            error.message || 'Uncaught Error in StrategyHub',
            { stack: errorInfo.componentStack, name: error.name }
        );

        this.setState({ error, errorInfo });
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="p-10 max-w-4xl mx-auto mt-10 bg-red-50 border border-red-200 rounded-xl text-red-900 font-mono text-sm overflow-auto">
                    <h1 className="text-2xl font-bold mb-4">Something went wrong.</h1>
                    <p className="mb-4 font-semibold">{this.state.error?.toString()}</p>
                    <details className="whitespace-pre-wrap">
                        {this.state.errorInfo?.componentStack}
                    </details>
                </div>
            );
        }

        return this.props.children;
    }
}

export default function DebugStrategyHub() {
    return (
        <ErrorBoundary>
            <StrategyHub />
        </ErrorBoundary>
    );
}

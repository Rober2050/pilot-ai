import { Component, ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
    onError?: (error: Error) => void;
}

interface State {
    hasError: boolean;
    error?: Error;
}

export class StageErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: any) {
        console.error('Stage Error:', error, errorInfo);
        this.props.onError?.(error);
    }

    render() {
        if (this.state.hasError) {
            return this.props.fallback || (
                <div className="flex flex-col items-center justify-center h-full p-8">
                    <AlertTriangle className="text-red-400 mb-4" size={64} />
                    <h3 className="text-2xl font-bold text-white mb-2">
                        Stage Error
                    </h3>
                    <p className="text-slate-400 text-center max-w-md">
                        This stage couldn't be loaded. Please try refreshing or skip to the next stage.
                    </p>
                </div>
            );
        }

        return this.props.children;
    }
}

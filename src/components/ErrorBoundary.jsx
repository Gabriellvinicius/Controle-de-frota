import React from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        this.setState({ error, errorInfo });
        console.error("Uncaught error:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{ padding: '2rem', backgroundColor: '#1a1a1a', color: '#ff5555', height: '100vh', fontFamily: 'monospace', overflow: 'auto' }}>
                    <h1 style={{ marginBottom: '20px' }}>Algo deu errado (Crash)</h1>

                    <div style={{ padding: '20px', backgroundColor: '#333', borderRadius: '8px' }}>
                        <h3 style={{ color: '#fff', marginBottom: '10px' }}>Erro:</h3>
                        <pre style={{ whiteSpace: 'pre-wrap', color: '#ffaaaa', fontSize: '1.2em' }}>
                            {this.state.error && this.state.error.toString()}
                        </pre>

                        <h3 style={{ color: '#fff', marginTop: '20px', marginBottom: '10px' }}>Onde:</h3>
                        <pre style={{ whiteSpace: 'pre-wrap', color: '#aaa', fontSize: '0.9em' }}>
                            {this.state.errorInfo && this.state.errorInfo.componentStack}
                        </pre>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;

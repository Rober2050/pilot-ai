import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css';
import './i18n/config';
import { ErrorBoundary } from './components/ErrorBoundary';
import { initializeSkills } from './services/ai/skills';

// ✅ Initialize Skills Engine
initializeSkills();

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <ErrorBoundary>
            <App />
        </ErrorBoundary>
    </React.StrictMode>,
)

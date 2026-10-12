import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LandingPage from './pages/LandingPage';
import { PUBLIC_SIGNUP_ENABLED } from './constants/authFeatures';

// ─── Route-level code splitting ───────────────────────────────────────────────
// Each lazy import becomes a separate chunk — only downloaded when the user
// actually navigates to that route. This is the primary way to reduce the
// initial JS bundle size and improve LCP on every route.

const Login = React.lazy(() => import('./pages/Login'));
const PublicRegistrationForm = React.lazy(() => import('./components/PublicRegistrationForm'));
const PublicPitch = React.lazy(() => import('./pages/PublicPitch'));
const ResetPassword = React.lazy(() => import('./pages/ResetPassword'));

// App shell (Layout wraps all private routes — split from public pages)
const Layout = React.lazy(() => import('./components/Layout'));

// Private routes — each in its own chunk
const DebugStrategyHub = React.lazy(() => import('./pages/DebugStrategyHub'));
const ProjectList      = React.lazy(() => import('./pages/ProjectList'));
const ProjectPipeline  = React.lazy(() => import('./pages/ProjectPipeline'));
const AdminConsole     = React.lazy(() => import('./pages/AdminConsole'));
const Settings         = React.lazy(() => import('./pages/Settings'));
const WarRoomPage      = React.lazy(() => import('./pages/WarRoomPage'));
const ArchitectureMap  = React.lazy(() => import('./pages/admin/ArchitectureMap'));
const AcademyCreator   = React.lazy(() => import('./components/admin/academy/AcademyCreator'));
const AcademyPage      = React.lazy(() => import('./pages/AcademyPage'));

// VoiceSystemTest: code-split to prevent VoiceService + AudioCache from
// initialising on the public landing page (they mount singletons on import).
const VoiceSystemTest = React.lazy(() =>
    import('./components/VoiceSystemTest').then(m => ({ default: m.VoiceSystemTest }))
);

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// Static pages for Terms/Privacy
const PrivacyPolicy = () => {
    const [content, setContent] = React.useState('');
    React.useEffect(() => {
        fetch('/privacy-policy.md').then(r => r.text()).then(setContent);
    }, []);
    return (
        <div className="min-h-screen bg-white py-12 px-4">
            <div className="max-w-4xl mx-auto prose prose-sm max-w-none">
                {content && (
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {content}
                    </ReactMarkdown>
                )}
            </div>
        </div>
    );
};

const TermsOfService = () => {
    const [content, setContent] = React.useState('');
    React.useEffect(() => {
        fetch('/terms-of-service.md').then(r => r.text()).then(setContent);
    }, []);
    return (
        <div className="min-h-screen bg-white py-12 px-4">
            <div className="max-w-4xl mx-auto prose prose-sm max-w-none">
                {content && (
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {content}
                    </ReactMarkdown>
                )}
            </div>
        </div>
    );
};

// ─── Route-level loading fallback ────────────────────────────────────────────
const RouteLoader = () => (
    <div className="flex items-center justify-center h-screen bg-white">
        <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
);

const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
    const { user, loading } = useAuth();
    if (loading) return <RouteLoader />;
    if (!user) return <Navigate to="/login" />;
    return <>{children}</>;
};

function App() {
    return (
        <AuthProvider>
            <Router>
                <Routes>
                    {/* Public landing — NOT lazy (is the entry point, must be instant) */}
                    <Route path="/" element={<LandingPage />} />

                    {/* Auth Routes */}
                    <Route path="/login" element={
                        <React.Suspense fallback={<RouteLoader />}>
                            <Login />
                        </React.Suspense>
                    } />
                    <Route path="/register" element={
                        PUBLIC_SIGNUP_ENABLED ? (
                            <React.Suspense fallback={<RouteLoader />}>
                                <PublicRegistrationForm />
                            </React.Suspense>
                        ) : <Navigate to="/login" replace />
                    } />
                    <Route path="/reset-password" element={
                        <React.Suspense fallback={<RouteLoader />}>
                            <ResetPassword />
                        </React.Suspense>
                    } />

                    {/* Official App Routes */}
                    <Route path="/pitch/:id" element={
                        <React.Suspense fallback={<RouteLoader />}>
                            <PublicPitch />
                        </React.Suspense>
                    } />
                    
                    <Route path="/app" element={
                        <PrivateRoute>
                            <React.Suspense fallback={<RouteLoader />}>
                                <Layout />
                            </React.Suspense>
                        </PrivateRoute>
                    }>
                        <Route index element={<Navigate to="strategy-hub" replace />} />
                        <Route path="strategy-hub" element={
                            <React.Suspense fallback={<RouteLoader />}>
                                <DebugStrategyHub />
                            </React.Suspense>
                        } />
                        <Route path="dashboard" element={
                            <React.Suspense fallback={<RouteLoader />}>
                                <ProjectList />
                            </React.Suspense>
                        } />
                        <Route path="projects/:id" element={
                            <React.Suspense fallback={<RouteLoader />}>
                                <ProjectPipeline />
                            </React.Suspense>
                        } />
                        <Route path="admin" element={
                            <React.Suspense fallback={<RouteLoader />}>
                                <AdminConsole />
                            </React.Suspense>
                        } />
                        <Route path="admin/architecture" element={
                            <React.Suspense fallback={<RouteLoader />}>
                                <ArchitectureMap />
                            </React.Suspense>
                        } />
                        <Route path="settings" element={
                            <React.Suspense fallback={<RouteLoader />}>
                                <Settings />
                            </React.Suspense>
                        } />
                        <Route path="war-room" element={
                            <React.Suspense fallback={<RouteLoader />}>
                                <WarRoomPage />
                            </React.Suspense>
                        } />
                        <Route path="voice-test" element={
                            <React.Suspense fallback={null}>
                                <VoiceSystemTest />
                            </React.Suspense>
                        } />
                        <Route path="academy-creator" element={
                            <React.Suspense fallback={<RouteLoader />}>
                                <AcademyCreator />
                            </React.Suspense>
                        } />
                    </Route>

                    {/* Academy — public, no login required */}
                    <Route path="/academy" element={
                        <React.Suspense fallback={<RouteLoader />}>
                            <AcademyPage />
                        </React.Suspense>
                    } />

                    {/* Static Pages */}
                    <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                    <Route path="/terms-of-service" element={<TermsOfService />} />

                    {/* Catch-all fallback */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </Router>
        </AuthProvider>
    );
}

export default App;

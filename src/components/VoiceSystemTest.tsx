import { useState, useEffect } from 'react';
import { Play, Pause, Square, Volume2, Zap } from 'lucide-react';
import { audioManager } from '../services/audioManager';
import { voiceService } from '../services/voiceService';
import { audioCache } from '../services/audioCache';
import { PlaybackState, Language } from '../types/voice';
import { ROLE_VOICES } from '../config/voiceConfig';

/**
 * Voice System Test Component
 * Test Google Cloud TTS integration, cache, and playback controls
 */
export const VoiceSystemTest = () => {
    const [state, setState] = useState<PlaybackState>(audioManager.getState());
    const [selectedRole, setSelectedRole] = useState('product-manager');
    const [selectedLanguage, setSelectedLanguage] = useState<Language>('es');
    const [testText, setTestText] = useState('Hola, soy el Product Manager. Estoy aquí para ayudarte a definir la visión del producto.');
    const [cacheStats, setCacheStats] = useState({ count: 0, sizeMB: 0 });
    const [apiStatus, setApiStatus] = useState<'unknown' | 'testing' | 'success' | 'error'>('unknown');

    useEffect(() => {
        // Subscribe to playback state changes
        const unsubscribe = audioManager.onStateChange(setState);

        // Load cache stats
        loadCacheStats();

        return unsubscribe;
    }, []);

    const loadCacheStats = async () => {
        const stats = await audioCache.getStats();
        setCacheStats(stats);
    };

    const testAPI = async () => {
        setApiStatus('testing');
        try {
            const success = await voiceService.testConnection();
            setApiStatus(success ? 'success' : 'error');
        } catch {
            setApiStatus('error');
        }
    };

    const handleSpeak = async () => {
        await audioManager.speak(testText, selectedRole, selectedLanguage);
        await loadCacheStats();
    };

    const handlePause = () => {
        audioManager.pause();
    };

    const handleResume = () => {
        audioManager.resume();
    };

    const handleStop = () => {
        audioManager.stop();
    };

    const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        audioManager.setVolume(Number(e.target.value));
    };

    const handleSpeedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        audioManager.setSpeed(Number(e.target.value));
    };

    const handleClearCache = async () => {
        await audioCache.clear();
        await loadCacheStats();
    };

    const roles = Object.keys(ROLE_VOICES);

    return (
        <div className="p-8 max-w-4xl mx-auto space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <h1 className="text-2xl font-bold text-slate-900 mb-2">Voice System Test</h1>
                <p className="text-slate-600 text-sm">Test Google Cloud TTS integration with cache and playback controls</p>
            </div>

            {/* API Status */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <h2 className="text-lg font-bold text-slate-800 mb-4">API Connection</h2>
                <div className="flex items-center gap-4">
                    <button
                        onClick={testAPI}
                        disabled={apiStatus === 'testing'}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 font-medium text-sm"
                    >
                        {apiStatus === 'testing' ? 'Testing...' : 'Test Connection'}
                    </button>
                    {apiStatus === 'success' && (
                        <span className="text-emerald-600 font-medium">✅ Connected</span>
                    )}
                    {apiStatus === 'error' && (
                        <span className="text-red-600 font-medium">❌ Connection Failed</span>
                    )}
                </div>
            </div>

            {/* Configuration */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
                <h2 className="text-lg font-bold text-slate-800 mb-4">Configuration</h2>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Role</label>
                    <select
                        value={selectedRole}
                        onChange={(e) => setSelectedRole(e.target.value)}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                        {roles.map(role => (
                            <option key={role} value={role}>
                                {role.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Language</label>
                    <div className="flex gap-4">
                        <label className="flex items-center gap-2">
                            <input
                                type="radio"
                                value="es"
                                checked={selectedLanguage === 'es'}
                                onChange={(e) => setSelectedLanguage(e.target.value as Language)}
                                className="text-indigo-600"
                            />
                            <span className="text-sm">Español</span>
                        </label>
                        <label className="flex items-center gap-2">
                            <input
                                type="radio"
                                value="en"
                                checked={selectedLanguage === 'en'}
                                onChange={(e) => setSelectedLanguage(e.target.value as Language)}
                                className="text-indigo-600"
                            />
                            <span className="text-sm">English</span>
                        </label>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Text to Speak</label>
                    <textarea
                        value={testText}
                        onChange={(e) => setTestText(e.target.value)}
                        rows={3}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                </div>
            </div>

            {/* Playback Controls */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
                <h2 className="text-lg font-bold text-slate-800 mb-4">Playback Controls</h2>

                <div className="flex gap-3">
                    <button
                        onClick={handleSpeak}
                        disabled={state.isPlaying}
                        className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 font-medium"
                    >
                        <Play className="w-4 h-4" />
                        Speak
                    </button>

                    {state.isPlaying && !state.isPaused && (
                        <button
                            onClick={handlePause}
                            className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 font-medium"
                        >
                            <Pause className="w-4 h-4" />
                            Pause
                        </button>
                    )}

                    {state.isPaused && (
                        <button
                            onClick={handleResume}
                            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium"
                        >
                            <Play className="w-4 h-4" />
                            Resume
                        </button>
                    )}

                    <button
                        onClick={handleStop}
                        disabled={!state.isPlaying && !state.isPaused}
                        className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 font-medium"
                    >
                        <Square className="w-4 h-4" />
                        Stop
                    </button>
                </div>

                {/* Progress Bar */}
                {(state.isPlaying || state.isPaused) && (
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm text-slate-600">
                            <span>Progress</span>
                            <span>{Math.round(state.progress)}%</span>
                        </div>
                        <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-indigo-600 transition-all duration-300"
                                style={{ width: `${state.progress}%` }}
                            />
                        </div>
                    </div>
                )}

                {/* Volume Control */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                            <Volume2 className="w-4 h-4" />
                            Volume
                        </label>
                        <span className="text-sm text-slate-600">{state.volume}%</span>
                    </div>
                    <input
                        type="range"
                        min="0"
                        max="100"
                        value={state.volume}
                        onChange={handleVolumeChange}
                        className="w-full"
                    />
                </div>

                {/* Speed Control */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                            <Zap className="w-4 h-4" />
                            Speed
                        </label>
                        <span className="text-sm text-slate-600">{state.speed}x</span>
                    </div>
                    <input
                        type="range"
                        min="0.5"
                        max="2"
                        step="0.1"
                        value={state.speed}
                        onChange={handleSpeedChange}
                        className="w-full"
                    />
                </div>
            </div>

            {/* Cache Stats */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-bold text-slate-800">Cache Statistics</h2>
                    <button
                        onClick={handleClearCache}
                        className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 font-medium"
                    >
                        Clear Cache
                    </button>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-50 p-4 rounded-lg">
                        <div className="text-2xl font-bold text-slate-900">{cacheStats.count}</div>
                        <div className="text-sm text-slate-600">Cached Files</div>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-lg">
                        <div className="text-2xl font-bold text-slate-900">{cacheStats.sizeMB.toFixed(2)} MB</div>
                        <div className="text-sm text-slate-600">Cache Size</div>
                    </div>
                </div>
            </div>

            {/* Current State */}
            {state.currentRoleId && (
                <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-6">
                    <h3 className="font-bold text-indigo-900 mb-2">Currently Speaking</h3>
                    <div className="text-sm text-indigo-700">
                        <div><strong>Role:</strong> {state.currentRoleId}</div>
                        <div><strong>Text:</strong> {state.currentText?.substring(0, 100)}...</div>
                    </div>
                </div>
            )}
        </div>
    );
};

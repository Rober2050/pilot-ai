import { useState } from 'react';
import { Volume2, Play, Pause, AlertCircle, Mic } from 'lucide-react';
import { enhancedBrowserTTS } from '../services/voice/EnhancedBrowserTTSProvider';
import { voiceService } from '../services/voiceService';
import { loggingService } from '../services/firebase/loggingService';

type VoiceProvider = 'browser' | 'google';
type Language = 'es' | 'en';

/**
 * Voice Test Page for Admin Console
 * Allows testing Browser TTS (FREE) vs Google TTS (PAID)
 */
export default function VoiceTestPage() {
    const [provider, setProvider] = useState<VoiceProvider>('browser');
    const [language, setLanguage] = useState<Language>('es');
    const [roleId, setRoleId] = useState('product-manager');
    const [testText, setTestText] = useState('Hola, esta es una prueba del sistema de voz.');
    const [isPlaying, setIsPlaying] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [voiceQuality, setVoiceQuality] = useState<any>(null);

    const roles = [
        { id: 'product-manager', name: 'Product Manager' },
        { id: 'architect', name: 'Architect' },
        { id: 'business-analyst', name: 'Business Analyst' },
        { id: 'ux-designer', name: 'UX Designer' },
        { id: 'developer', name: 'Developer' },
        { id: 'qa-engineer', name: 'QA Engineer' }
    ];

    const handleTestVoice = async () => {
        setError(null);
        setIsPlaying(true);

        try {
            loggingService.logInfo(
                'VoiceTestPage',
                `Testing ${provider} TTS`,
                { provider, language, roleId, textLength: testText.length }
            );

            if (provider === 'browser') {
                await enhancedBrowserTTS.speak(testText, roleId, language);
            } else {
                // Google TTS - use synthesize method
                const response = await voiceService.synthesize({
                    text: testText,
                    roleId,
                    language
                });

                // Convert base64 to audio and play
                const audioBlob = base64ToBlob(response.audioContent, 'audio/mp3');
                const audioUrl = URL.createObjectURL(audioBlob);
                const audio = new Audio(audioUrl);

                await new Promise<void>((resolve, reject) => {
                    audio.onended = () => {
                        URL.revokeObjectURL(audioUrl);
                        resolve();
                    };
                    audio.onerror = () => {
                        URL.revokeObjectURL(audioUrl);
                        reject(new Error('Audio playback failed'));
                    };
                    audio.play();
                });
            }

            loggingService.logInfo(
                'VoiceTestPage',
                `${provider} TTS test completed successfully`,
                { provider, language }
            );

        } catch (err: any) {
            const errorMsg = err.message || 'Unknown error';
            setError(errorMsg);

            loggingService.logError(
                'VoiceTestPage',
                `${provider} TTS test failed`,
                { provider, language, error: errorMsg }
            );
        } finally {
            setIsPlaying(false);
        }
    };

    // Helper function to convert base64 to Blob
    const base64ToBlob = (base64: string, mimeType: string): Blob => {
        const byteCharacters = atob(base64);
        const byteNumbers = new Array(byteCharacters.length);

        for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
        }

        const byteArray = new Uint8Array(byteNumbers);
        return new Blob([byteArray], { type: mimeType });
    };

    const handleTestQuality = async () => {
        if (provider === 'browser') {
            const quality = await enhancedBrowserTTS.testVoice(language);
            setVoiceQuality(quality);

            loggingService.logInfo(
                'VoiceTestPage',
                'Voice quality test completed',
                { quality }
            );
        }
    };

    const handleStop = () => {
        if (provider === 'browser') {
            enhancedBrowserTTS.stop();
        }
        setIsPlaying(false);
    };

    const estimateCost = () => {
        if (provider === 'google') {
            const characters = testText.length;
            const costPer1M = 16; // $16 per 1M characters
            const cost = (characters / 1000000) * costPer1M;
            return cost.toFixed(6);
        }
        return '0.00';
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h2 className="text-2xl font-bold text-slate-900">Voice Test</h2>
                <p className="text-slate-600 mt-1">
                    Test and compare Browser TTS (FREE) vs Google Cloud TTS (PAID)
                </p>
            </div>

            {/* Provider Selection */}
            <div className="card">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Voice Provider</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Browser TTS */}
                    <button
                        onClick={() => setProvider('browser')}
                        className={`p-6 rounded-xl border-2 transition-all text-left ${provider === 'browser'
                            ? 'border-green-500 bg-green-50'
                            : 'border-slate-200 hover:border-slate-300'
                            }`}
                    >
                        <div className="flex items-center gap-3 mb-2">
                            <div className={`p-2 rounded-lg ${provider === 'browser' ? 'bg-green-500' : 'bg-slate-200'}`}>
                                <Volume2 className={`w-5 h-5 ${provider === 'browser' ? 'text-white' : 'text-slate-600'}`} />
                            </div>
                            <div>
                                <h4 className="font-bold text-slate-900">Browser TTS</h4>
                                <span className="text-xs font-bold text-green-600 uppercase">FREE</span>
                            </div>
                        </div>
                        <p className="text-sm text-slate-600">
                            Uses native browser voices. Quality varies by browser/OS. No API costs.
                        </p>
                    </button>

                    {/* Google TTS */}
                    <button
                        onClick={() => setProvider('google')}
                        className={`p-6 rounded-xl border-2 transition-all text-left ${provider === 'google'
                            ? 'border-indigo-500 bg-indigo-50'
                            : 'border-slate-200 hover:border-slate-300'
                            }`}
                    >
                        <div className="flex items-center gap-3 mb-2">
                            <div className={`p-2 rounded-lg ${provider === 'google' ? 'bg-indigo-500' : 'bg-slate-200'}`}>
                                <Mic className={`w-5 h-5 ${provider === 'google' ? 'text-white' : 'text-slate-600'}`} />
                            </div>
                            <div>
                                <h4 className="font-bold text-slate-900">Google Cloud TTS</h4>
                                <span className="text-xs font-bold text-orange-600 uppercase">PAID</span>
                            </div>
                        </div>
                        <p className="text-sm text-slate-600">
                            Premium quality voices. $16 per 1M characters. Requires API key.
                        </p>
                    </button>
                </div>
            </div>

            {/* Configuration */}
            <div className="card">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Configuration</h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Language */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Language
                        </label>
                        <select
                            value={language}
                            onChange={(e) => setLanguage(e.target.value as Language)}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        >
                            <option value="es">Spanish (ES)</option>
                            <option value="en">English (EN)</option>
                        </select>
                    </div>

                    {/* Role */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Role
                        </label>
                        <select
                            value={roleId}
                            onChange={(e) => setRoleId(e.target.value)}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        >
                            {roles.map(role => (
                                <option key={role.id} value={role.id}>{role.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Quality Test (Browser only) */}
                    {provider === 'browser' && (
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Voice Quality
                            </label>
                            <button
                                onClick={handleTestQuality}
                                className="w-full px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-colors"
                            >
                                Test Quality
                            </button>
                        </div>
                    )}
                </div>

                {/* Voice Quality Result */}
                {voiceQuality && (
                    <div className="mt-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                                <span className="text-slate-500">Available:</span>
                                <span className={`ml-2 font-bold ${voiceQuality.available ? 'text-green-600' : 'text-red-600'}`}>
                                    {voiceQuality.available ? 'Yes' : 'No'}
                                </span>
                            </div>
                            <div>
                                <span className="text-slate-500">Voice:</span>
                                <span className="ml-2 font-mono text-slate-900">{voiceQuality.voiceName}</span>
                            </div>
                            <div>
                                <span className="text-slate-500">Quality:</span>
                                <span className={`ml-2 font-bold ${voiceQuality.quality === 'high' ? 'text-green-600' :
                                    voiceQuality.quality === 'medium' ? 'text-yellow-600' :
                                        'text-red-600'
                                    }`}>
                                    {voiceQuality.quality.toUpperCase()}
                                </span>
                            </div>
                            <div>
                                <span className="text-slate-500">Provider:</span>
                                <span className="ml-2 font-bold text-indigo-600">{voiceQuality.provider.toUpperCase()}</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Test Text */}
            <div className="card">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Test Text</h3>

                <textarea
                    value={testText}
                    onChange={(e) => setTestText(e.target.value)}
                    rows={4}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                    placeholder="Enter text to test..."
                />

                <div className="mt-4 flex items-center justify-between">
                    <div className="text-sm text-slate-600">
                        <span className="font-medium">{testText.length}</span> characters
                        {provider === 'google' && (
                            <span className="ml-4">
                                Est. Cost: <span className="font-bold text-orange-600">${estimateCost()}</span>
                            </span>
                        )}
                    </div>

                    <div className="flex gap-2">
                        {isPlaying && (
                            <button
                                onClick={handleStop}
                                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                            >
                                <Pause className="w-4 h-4" />
                                Stop
                            </button>
                        )}

                        <button
                            onClick={handleTestVoice}
                            disabled={isPlaying || !testText}
                            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                        >
                            {isPlaying ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                                    Playing...
                                </>
                            ) : (
                                <>
                                    <Play className="w-4 h-4 fill-current" />
                                    Test Voice
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Error Display */}
                {error && (
                    <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                        <div>
                            <h4 className="font-semibold text-red-900">Error</h4>
                            <p className="text-sm text-red-700 mt-1">{error}</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Cost Comparison */}
            <div className="card">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Cost Comparison</h3>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-slate-200">
                                <th className="text-left py-3 px-4 font-semibold text-slate-700">Provider</th>
                                <th className="text-left py-3 px-4 font-semibold text-slate-700">Quality</th>
                                <th className="text-left py-3 px-4 font-semibold text-slate-700">Cost</th>
                                <th className="text-left py-3 px-4 font-semibold text-slate-700">Best For</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr className="border-b border-slate-100">
                                <td className="py-3 px-4 font-medium">Browser TTS</td>
                                <td className="py-3 px-4">
                                    <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-xs font-bold">MEDIUM</span>
                                </td>
                                <td className="py-3 px-4">
                                    <span className="font-bold text-green-600">$0.00</span>
                                </td>
                                <td className="py-3 px-4 text-slate-600">On-demand chat messages</td>
                            </tr>
                            <tr>
                                <td className="py-3 px-4 font-medium">Google Cloud TTS</td>
                                <td className="py-3 px-4">
                                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-bold">HIGH</span>
                                </td>
                                <td className="py-3 px-4">
                                    <span className="font-bold text-orange-600">$16 / 1M chars</span>
                                </td>
                                <td className="py-3 px-4 text-slate-600">Critical verdicts only</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div className="mt-4 p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
                    <h4 className="font-semibold text-indigo-900 mb-2">💡 Recommendation</h4>
                    <p className="text-sm text-indigo-700">
                        Use <strong>Browser TTS</strong> for on-demand chat audio (90%+ cost savings) and
                        <strong> Google TTS</strong> only for auto-playing verdict messages.
                    </p>
                </div>
            </div>
        </div>
    );
}

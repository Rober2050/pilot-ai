import { useState } from 'react';
import { Code, Database, Layout, Server, Download, Loader2, AlertTriangle } from 'lucide-react';
import { geminiService } from '../services/gemini/geminiService';


export default function CodeGenerator() {
    const [stack, setStack] = useState({
        frontend: 'React + Vite + Tailwind',
        backend: 'Node.js + Express',
        database: 'Firebase Firestore'
    });
    const [generating, setGenerating] = useState(false);
    const [generatedCode, setGeneratedCode] = useState<string | null>(null);

    const handleGenerate = async () => {
        setGenerating(true);
        setGeneratedCode(null);
        try {
            const response = await geminiService.generateCodebaseStructure(stack);
            setGeneratedCode(response);
        } catch (error) {
            console.error("Generation error:", error);
            setGeneratedCode("// Error generating code. Please check your API key and try again.");
        } finally {
            setGenerating(false);
        }
    };

    return (
        <div className="max-w-5xl mx-auto">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">AI Code Generator</h1>
                    <p className="text-slate-500">Transform your blueprint into a technical foundation</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Configuration */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="card">
                        <h2 className="text-lg font-bold text-slate-900 mb-4">Tech Stack</h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                                    <Layout className="h-4 w-4" /> Frontend
                                </label>
                                <select
                                    value={stack.frontend}
                                    onChange={(e) => setStack({ ...stack, frontend: e.target.value })}
                                    className="input-field"
                                >
                                    <option>React + Vite + Tailwind</option>
                                    <option>Next.js + Tailwind</option>
                                    <option>Vue.js + Vite</option>
                                    <option>Angular</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                                    <Server className="h-4 w-4" /> Backend
                                </label>
                                <select
                                    value={stack.backend}
                                    onChange={(e) => setStack({ ...stack, backend: e.target.value })}
                                    className="input-field"
                                >
                                    <option>Node.js + Express</option>
                                    <option>NestJS</option>
                                    <option>Python Django</option>
                                    <option>Go Fiber</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                                    <Database className="h-4 w-4" /> Database
                                </label>
                                <select
                                    value={stack.database}
                                    onChange={(e) => setStack({ ...stack, database: e.target.value })}
                                    className="input-field"
                                >
                                    <option>Firebase Firestore</option>
                                    <option>PostgreSQL</option>
                                    <option>MongoDB</option>
                                    <option>MySQL</option>
                                </select>
                            </div>
                        </div>

                        <div className="mt-6 pt-6 border-t border-slate-100">
                            <button
                                onClick={handleGenerate}
                                disabled={generating}
                                className="w-full btn-primary"
                            >
                                {generating ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Generating...
                                    </>
                                ) : (
                                    <>
                                        <Code className="h-4 w-4" />
                                        Generate Codebase
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                    <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
                        <div className="flex items-start gap-3">
                            <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0" />
                            <div>
                                <h4 className="font-medium text-amber-900 text-sm">Prototype Warning</h4>
                                <p className="text-amber-700 text-xs mt-1">
                                    The generated code is a starting point. Always review security and scalability before production use.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Output */}
                <div className="lg:col-span-2">
                    <div className="card h-full flex flex-col min-h-[500px]">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-bold text-slate-900">Generated Output</h2>
                            {generatedCode && (
                                <button className="btn-secondary text-xs py-1.5">
                                    <Download className="h-3 w-3" />
                                    Download ZIP
                                </button>
                            )}
                        </div>

                        <div className="flex-1 bg-slate-900 rounded-xl p-4 overflow-auto">
                            {generatedCode ? (
                                <pre className="text-emerald-400 font-mono text-sm whitespace-pre-wrap">
                                    {generatedCode}
                                </pre>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-slate-600">
                                    <Code className="h-12 w-12 mb-4 opacity-20" />
                                    <p>Select your stack and click Generate</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

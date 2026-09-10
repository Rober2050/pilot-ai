/**
 * Sources Tab Component
 * Displays source citations with credibility tiers for Strategy Analyst output
 */

import React from 'react';
import { SourceCitation } from '../../types/war-room';
import { ExternalLink, CheckCircle, AlertCircle } from 'lucide-react';

interface SourcesTabProps {
    sources?: SourceCitation[];
}

export const SourcesTab: React.FC<SourcesTabProps> = ({ sources }) => {
    if (!sources || sources.length === 0) {
        return (
            <div className="text-center py-12">
                <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 font-medium">No se citaron fuentes en este análisis</p>
                <p className="text-gray-500 text-sm mt-2">
                    Las fuentes aparecerán aquí cuando el análisis incluya datos verificables
                </p>
            </div>
        );
    }

    const getTierColor = (tier: number) => {
        switch (tier) {
            case 1: return 'bg-green-100 text-green-800 border-green-300';
            case 2: return 'bg-blue-100 text-blue-800 border-blue-300';
            case 3: return 'bg-yellow-100 text-yellow-800 border-yellow-300';
            case 4: return 'bg-red-100 text-red-800 border-red-300';
            default: return 'bg-gray-100 text-gray-800 border-gray-300';
        }
    };

    const getTierLabel = (tier: number) => {
        switch (tier) {
            case 1: return 'Nivel 1 - Máxima Credibilidad';
            case 2: return 'Nivel 2 - Alta Credibilidad';
            case 3: return 'Nivel 3 - Credibilidad Media';
            case 4: return 'Nivel 4 - Baja Credibilidad';
            default: return 'Sin clasificar';
        }
    };

    const getTierStars = (tier: number) => {
        return '⭐'.repeat(5 - tier);
    };

    const getDataAge = (year: number) => {
        const currentYear = new Date().getFullYear();
        const age = currentYear - year;

        if (age === 0) return { text: 'Datos actuales', color: 'text-green-600' };
        if (age === 1) return { text: '1 año', color: 'text-green-600' };
        if (age <= 2) return { text: `${age} años`, color: 'text-blue-600' };
        if (age <= 3) return { text: `${age} años`, color: 'text-yellow-600' };
        return { text: `${age} años (desactualizado)`, color: 'text-red-600' };
    };

    return (
        <div className="space-y-6 p-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-xl font-bold text-gray-900">Fuentes Consultadas</h3>
                    <p className="text-sm text-gray-600 mt-1">
                        {sources.length} fuente{sources.length !== 1 ? 's' : ''} citada{sources.length !== 1 ? 's' : ''}
                    </p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-600" />
            </div>

            {/* Legend */}
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <p className="text-sm font-semibold text-gray-700 mb-2">Jerarquía de Credibilidad:</p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center gap-2">
                        <span className="text-green-600">⭐⭐⭐⭐</span>
                        <span className="text-gray-600">Nivel 1: Reportes de industria, Datos gubernamentales</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-blue-600">⭐⭐⭐</span>
                        <span className="text-gray-600">Nivel 2: Finanzas públicas, Noticias reputadas</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-yellow-600">⭐⭐</span>
                        <span className="text-gray-600">Nivel 3: Blogs de industria, Comunicados</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-red-600">⭐</span>
                        <span className="text-gray-600">Nivel 4: Redes sociales, Blogs no verificados</span>
                    </div>
                </div>
            </div>

            {/* Sources List */}
            <div className="space-y-4">
                {sources.map((source, index) => {
                    const dataAge = getDataAge(source.year);

                    return (
                        <div
                            key={index}
                            className="border-2 rounded-lg p-5 bg-white shadow-sm hover:shadow-md transition-shadow"
                        >
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex-1">
                                    {/* Claim */}
                                    <p className="font-semibold text-gray-900 text-lg mb-2">
                                        {source.claim}
                                    </p>

                                    {/* Source Info */}
                                    <div className="flex items-center gap-3 text-sm text-gray-600 mb-3">
                                        <span className="font-medium">{source.source}</span>
                                        <span className="text-gray-400">•</span>
                                        <span className={dataAge.color}>{source.year} ({dataAge.text})</span>
                                    </div>

                                    {/* URL */}
                                    {source.url && (
                                        <a
                                            href={source.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 hover:underline transition-colors"
                                        >
                                            <ExternalLink className="w-4 h-4" />
                                            Ver fuente original
                                        </a>
                                    )}
                                </div>

                                {/* Tier Badge */}
                                <div className="flex flex-col items-end gap-2">
                                    <div className={`px-4 py-2 rounded-full border-2 text-xs font-bold ${getTierColor(source.tier)}`}>
                                        {getTierLabel(source.tier)}
                                    </div>
                                    <div className="text-2xl">
                                        {getTierStars(source.tier)}
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Footer Note */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
                <p className="font-medium mb-1">💡 Nota sobre las fuentes:</p>
                <p>
                    Las fuentes se generan automáticamente cuando Google Grounding está activo.
                    Prioriza fuentes de Nivel 1-2 para decisiones críticas.
                </p>
            </div>
        </div>
    );
};

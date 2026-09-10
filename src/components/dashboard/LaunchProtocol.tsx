import React from 'react';
import { useTranslation } from 'react-i18next';
import {
    Settings, CheckCircle, Search, Beaker, ArrowRight,
    Rocket, Lock, ChevronRight, AlertCircle, Play
} from 'lucide-react';

interface LaunchProtocolProps {
    currentPhase?: 1 | 2 | 3;
}

const LaunchProtocol: React.FC<LaunchProtocolProps> = ({ currentPhase = 2 }) => {
    const { t } = useTranslation('translation');

    const phases = [
        {
            id: 1,
            title: t('marketing.launchProtocol.phase1.title') || "Infraestructura",
            subtitle: t('marketing.launchProtocol.phase1.subtitle') || "La Plomería",
            icon: Settings,
            status: 'completed', // completed, active, locked
            description: "Base técnica esencial para medir resultados.",
            checklist: [
                t('marketing.launchProtocol.phase1.check1') || "Pixel Configurado",
                t('marketing.launchProtocol.phase1.check2') || "Dominio Verificado",
                t('marketing.launchProtocol.phase1.check3') || "Catálogo Cargado"
            ]
        },
        {
            id: 2,
            title: t('marketing.launchProtocol.phase2.title') || "Validación",
            subtitle: t('marketing.launchProtocol.phase2.subtitle') || "El Laboratorio",
            icon: Beaker,
            status: 'active',
            description: "Inversión mínima para validar hipótesis ganadoras.",
            checklist: [
                t('marketing.launchProtocol.phase2.check1') || "Test A/B Creativos",
                t('marketing.launchProtocol.phase2.check2') || "Test de Ángulos",
                t('marketing.launchProtocol.phase2.check3') || "CPA Objetivo Validado"
            ]
        },
        {
            id: 3,
            title: t('marketing.launchProtocol.phase3.title') || "Escalamiento",
            subtitle: t('marketing.launchProtocol.phase3.subtitle') || "La Maquinaria",
            icon: Rocket,
            status: 'locked',
            description: "Aumentar presupuesto solo sobre ganadores validados.",
            checklist: [
                t('marketing.launchProtocol.phase3.check1') || "Incremento 20% / 48hs",
                t('marketing.launchProtocol.phase3.check2') || "Nuevos Canales",
                t('marketing.launchProtocol.phase3.check3') || "Automatización"
            ]
        }
    ];

    return (
        <div className="w-full">
            <div className="flex items-center gap-2 mb-6">
                <div className="p-2 bg-indigo-50 rounded-lg">
                    <Rocket className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                    <h3 className="font-bold text-slate-800 text-lg">
                        {t('marketing.launchProtocol.title') || "Roadmap de Validación y Escalamiento"}
                    </h3>
                    <p className="text-xs text-slate-500">
                        {t('marketing.launchProtocol.description') || "Protocolo de lanzamiento secuencial para minimizar riesgo y maximizar retorno."}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative">
                {/* Connecting Line (Desktop) */}
                <div className="hidden md:block absolute top-[2.5rem] left-[16%] right-[16%] h-0.5 bg-slate-100 -z-10"></div>

                {phases.map((phase, index) => {
                    const isCompleted = phase.status === 'completed';
                    const isActive = phase.status === 'active';
                    const isLocked = phase.status === 'locked';

                    return (
                        <div
                            key={phase.id}
                            className={`
                                relative rounded-xl border p-5 transition-all duration-300
                                ${isCompleted ? 'bg-emerald-50/50 border-emerald-100' : ''}
                                ${isActive ? 'bg-white border-blue-500/30 shadow-[0_0_20px_rgba(59,130,246,0.1)] scale-[1.02] ring-1 ring-blue-500/20' : ''}
                                ${isLocked ? 'bg-slate-50 border-slate-200 opacity-70 grayscale' : ''}
                            `}
                        >
                            {/* Phase Badge */}
                            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white border shadow-sm z-10 whitespace-nowrap">
                                {isCompleted && <span className="text-emerald-600 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Completado</span>}
                                {isActive && <span className="text-blue-600 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span> En Progreso</span>}
                                {isLocked && <span className="text-slate-400 flex items-center gap-1"><Lock className="w-3 h-3" /> Bloqueado</span>}
                            </div>

                            {/* Icon Header */}
                            <div className={`
                                w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-4 border-4 transition-colors
                                ${isCompleted ? 'bg-white border-emerald-100 text-emerald-500' : ''}
                                ${isActive ? 'bg-blue-50 border-blue-100 text-blue-600' : ''}
                                ${isLocked ? 'bg-slate-100 border-slate-200 text-slate-400' : ''}
                            `}>
                                <phase.icon className={`w-8 h-8 ${isActive ? 'animate-pulse' : ''}`} />
                            </div>

                            {/* Content */}
                            <div className="text-center mb-4">
                                <h4 className={`font-bold text-lg ${isLocked ? 'text-slate-500' : 'text-slate-800'}`}>
                                    {phase.title}
                                </h4>
                                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                                    {phase.subtitle}
                                </p>
                                <p className="text-xs text-slate-500 leading-relaxed min-h-[3rem]">
                                    {phase.description}
                                </p>
                            </div>

                            {/* Checklist */}
                            <div className={`
                                rounded-lg p-3 text-left text-sm space-y-2
                                ${isCompleted ? 'bg-emerald-100/30' : ''}
                                ${isActive ? 'bg-blue-50' : ''}
                                ${isLocked ? 'bg-slate-100' : ''}
                            `}>
                                {phase.checklist.map((item, idx) => (
                                    <div key={idx} className="flex items-start gap-2">
                                        <div className={`
                                            mt-0.5 w-4 h-4 rounded-full flex items-center justify-center border text-[10px] shrink-0
                                            ${isCompleted ? 'bg-emerald-500 border-emerald-500 text-white' : ''}
                                            ${isActive ? 'bg-white border-blue-300 text-blue-500' : ''}
                                            ${isLocked ? 'bg-slate-200 border-slate-300 text-slate-400' : ''}
                                        `}>
                                            {isCompleted ? <CheckCircle className="w-3 h-3" /> : (idx + 1)}
                                        </div>
                                        <span className={`
                                            ${isCompleted ? 'text-emerald-800 font-medium' : ''}
                                            ${isActive ? 'text-slate-700' : ''}
                                            ${isLocked ? 'text-slate-400' : ''}
                                        `}>
                                            {item}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            {/* Locked Overlay Message */}
                            {isLocked && (
                                <div className="absolute inset-0 bg-slate-50/50 backdrop-blur-[1px] flex items-center justify-center rounded-xl z-20">
                                    <div className="bg-white px-4 py-2 rounded-lg shadow-sm border border-slate-200 text-xs font-medium text-slate-500 flex items-center gap-2">
                                        <Lock className="w-3 h-3" />
                                        Completa Fase 2
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default LaunchProtocol;

import { useState, Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Palette, Layout, Type, Zap, Image as ImageIcon,
    AlertCircle, CheckCircle2, Eye, Accessibility, BookOpen, Code
} from 'lucide-react';
import { PrototypeCard } from '../PrototypeCard';

interface UXDesignerDashboardProps {
    data: any;
    projectId?: string;
    roleId?: string;
}

interface ColorData {
    hex?: string;
    name?: string;
    rgb?: string;
    hsl?: string;
    usage?: string;
    psychology?: string;
    wcagRatio?: string;
    reference?: string;
}

// Normalize data to handle both new and old formats + validate structure
const normalizeData = (rawData: any) => {
    // Guard: if data is not an object, return empty structure
    if (!rawData || typeof rawData !== 'object') {
        console.error('[UXDesignerDashboard] Invalid data type:', typeof rawData);
        return {
            brief: {},
            executiveSummary: '',
            colorSystem: {},
            designSystem: {},
            visualReferences: [],
            accessibility: {},
            responsiveBreakpoints: {},
            uiPatterns: [],
            prototype: '',
            isIncomplete: true
        };
    }

    const brief = rawData.brief || {};
    const executiveSummary = rawData.executiveSummary || '';
    const colorSystem = rawData.colorSystem || {};
    const designSystem = rawData.designSystem || {};
    const visualReferences = rawData.visualReferences || [];
    const accessibility = rawData.accessibility || {};
    const responsiveBreakpoints = rawData.responsiveBreakpoints || {};
    const uiPatterns = rawData.uiPatterns || [];
    const prototype = rawData.prototype || '';

    // Check if critical fields are missing (indicates incomplete response)
    const isIncomplete = !executiveSummary || (!brief.summary && !prototype);

    return {
        brief,
        executiveSummary,
        colorSystem,
        designSystem,
        visualReferences,
        accessibility,
        responsiveBreakpoints,
        uiPatterns,
        prototype,
        isIncomplete
    };
};

const ColorSwatch = ({ color, label }: { color: ColorData; label: string }) => {
    const hex = color.hex || '#000000';
    return (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
            <div
                className="h-24 border-b border-slate-100"
                style={{ backgroundColor: hex }}
                title={hex}
            />
            <div className="p-3 text-sm">
                <h4 className="font-semibold text-slate-800 mb-1">{label}</h4>
                <p className="text-xs text-slate-500 font-mono mb-1 select-all">{hex}</p>
                {color.name && <p className="text-xs font-medium text-slate-700 mb-1">{color.name}</p>}
                {color.psychology && <p className="text-xs text-slate-600 italic mb-1">{color.psychology}</p>}
                {color.usage && <p className="text-xs text-slate-600 mb-1">{color.usage}</p>}
                {color.wcagRatio && (
                    <div className="mt-2 inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 px-2 py-1 rounded text-[10px] font-bold">
                        <CheckCircle2 className="w-2.5 h-2.5" />
                        WCAG {color.wcagRatio}
                    </div>
                )}
            </div>
        </div>
    );
};

const EmptyState = ({ message }: { message: string }) => (
    <div className="flex items-center justify-center py-12 px-4 bg-slate-50 rounded-lg border border-slate-200 border-dashed">
        <div className="text-center">
            <AlertCircle className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="text-slate-600 text-sm">{message}</p>
        </div>
    </div>
);

/** The protocol returns the UI type as a bare letter (A–E); show its readable name instead. */
export const formatUiType = (uiType: string, t: (key: string) => string): string => {
    const letter = uiType.trim().match(/^([A-E])\b/i)?.[1]?.toUpperCase();
    return letter ? t(`uxBrief.uiTypes.${letter}`) : uiType;
};

export const UXDesignerDashboard = ({ data, projectId, roleId }: UXDesignerDashboardProps) => {
    const { t } = useTranslation('translation');
    const [activeTab, setActiveTab] = useState<'summary' | 'foundation' | 'components' | 'references' | 'accessibility' | 'prototype'>('summary');

    const { brief, executiveSummary, colorSystem, designSystem, visualReferences, accessibility, responsiveBreakpoints, uiPatterns, prototype, isIncomplete } = normalizeData(data);

    // Guard: if data is incomplete, show recovery message
    if (isIncomplete) {
        return (
            <div className="space-y-4 animate-in fade-in duration-700">
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 flex gap-4 items-start">
                    <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                        <h3 className="font-semibold text-amber-900 mb-1">Incomplete Design Response</h3>
                        <p className="text-sm text-amber-700 mb-3">
                            The UX Designer response was incomplete or encountered a parsing error. This may happen due to network timeouts or model response issues.
                        </p>
                        <p className="text-xs text-amber-600">
                            <strong>Recommendation:</strong> Try executing the UX/UI Designer role again. The second execution should succeed and return complete design specifications.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    const tabs = [
        { id: 'summary' as const, label: 'Summary', icon: BookOpen },
        { id: 'foundation' as const, label: 'Design Foundation', icon: Palette },
        { id: 'components' as const, label: 'Component Library', icon: Code },
        { id: 'references' as const, label: 'Visual References', icon: Eye },
        { id: 'accessibility' as const, label: 'Accessibility', icon: Accessibility },
        { id: 'prototype' as const, label: 'Prototype', icon: ImageIcon },
    ];

    return (
        <div className="space-y-3 font-sans animate-in fade-in duration-700">
            {/* Executive Summary Card (always visible) */}
            {executiveSummary && (
                <div className="bg-white px-5 py-4 rounded-xl border border-slate-100 shadow-sm">
                    <h3 className="font-bold text-slate-800 mb-2 flex items-center gap-2 text-sm">
                        <BookOpen className="w-4 h-4 text-indigo-600" />
                        Design Philosophy
                    </h3>
                    <p className="text-sm text-slate-700 leading-relaxed">{executiveSummary}</p>
                </div>
            )}

            {/* KPI Cards */}
            {brief && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    {brief.industry && (
                        <div className="bg-white border border-slate-200 rounded-lg p-3">
                            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-1">{t('uxBrief.industry')}</p>
                            <p className="text-sm font-bold text-slate-800">{brief.industry}</p>
                        </div>
                    )}
                    {brief.uiType && (
                        <div className="bg-white border border-slate-200 rounded-lg p-3">
                            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-1">{t('uxBrief.uiType')}</p>
                            <p className="text-sm font-bold text-slate-800">{formatUiType(brief.uiType, t)}</p>
                        </div>
                    )}
                    {brief.brandDetected && (
                        <div className="bg-white border border-emerald-200 rounded-lg p-3">
                            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-1">{t('uxBrief.brand')}</p>
                            <p className="text-sm font-bold text-emerald-700">{brief.brandDetected}</p>
                            {brief.brandConfidence && (
                                <p className="text-[10px] text-emerald-600 mt-1">{t('uxBrief.confidence')}: {brief.brandConfidence}%</p>
                            )}
                        </div>
                    )}
                    {brief.emotionalTone && (
                        <div className="bg-white border border-slate-200 rounded-lg p-3">
                            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-1">{t('uxBrief.tone')}</p>
                            <p className="text-sm font-bold text-slate-800">{brief.emotionalTone}</p>
                        </div>
                    )}
                </div>
            )}

            {/* Tab Navigation */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="flex border-b border-slate-100 overflow-x-auto px-2 pt-2 gap-1">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`px-4 py-2 rounded-lg text-[12px] font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap font-sans
                                ${activeTab === tab.id
                                    ? 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200'
                                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                                }
                            `}
                        >
                            <tab.icon className={`w-3.5 h-3.5 ${activeTab === tab.id ? 'text-indigo-600' : 'text-slate-400'}`} />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                <div className="p-4">
                    {/* SUMMARY TAB */}
                    {activeTab === 'summary' && (
                        <div className="space-y-4">
                            {brief.summary && (
                                <div className="bg-indigo-50/30 p-4 rounded-xl border border-indigo-100">
                                    <h4 className="font-bold text-slate-800 mb-2 flex items-center gap-2 text-sm">
                                        <Layout className="w-4 h-4 text-indigo-600" />
                                        Project Summary
                                    </h4>
                                    <p className="text-sm text-slate-700">{brief.summary}</p>
                                </div>
                            )}
                            {brief.trendInfluences && brief.trendInfluences.length > 0 && (
                                <div className="bg-white border border-slate-200 rounded-lg p-4">
                                    <h4 className="font-bold text-slate-800 mb-3 text-sm">2026 Design Trends Applied</h4>
                                    <ul className="space-y-2">
                                        {brief.trendInfluences.map((trend: string, idx: number) => (
                                            <li key={idx} className="flex gap-2 items-start text-sm text-slate-700">
                                                <span className="text-indigo-500 font-bold mt-0.5">•</span>
                                                {trend}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                            {brief.keyInsight && (
                                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                                    <h4 className="font-bold text-slate-800 mb-2 text-sm">Key Design Insight</h4>
                                    <p className="text-sm text-slate-700 italic">{brief.keyInsight}</p>
                                </div>
                            )}
                            {brief.brandInvestigation && (
                                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                                    <h4 className="font-bold text-slate-800 mb-2 text-sm">Brand Research</h4>
                                    <p className="text-sm text-slate-700">{brief.brandInvestigation}</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* DESIGN FOUNDATION TAB */}
                    {activeTab === 'foundation' && (
                        <div className="space-y-4">
                            {/* Color System */}
                            {Object.keys(colorSystem).length > 0 && colorSystem.primary && (
                                <div>
                                    <h4 className="font-bold text-slate-800 mb-3 text-sm">Color Palette</h4>
                                    {colorSystem.strategy && (
                                        <p className="text-xs text-slate-600 mb-3 italic">{colorSystem.strategy}</p>
                                    )}
                                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-3">
                                        {colorSystem.primary && <ColorSwatch color={colorSystem.primary} label="Primary" />}
                                        {colorSystem.secondary && <ColorSwatch color={colorSystem.secondary} label="Secondary" />}
                                        {colorSystem.accent && <ColorSwatch color={colorSystem.accent} label="Accent" />}
                                        {colorSystem.background && <ColorSwatch color={colorSystem.background} label="Background" />}
                                        {colorSystem.text && <ColorSwatch color={colorSystem.text} label="Text" />}
                                        {colorSystem.success && <ColorSwatch color={colorSystem.success} label="Success" />}
                                        {colorSystem.error && <ColorSwatch color={colorSystem.error} label="Error" />}
                                        {colorSystem.warning && <ColorSwatch color={colorSystem.warning} label="Warning" />}
                                    </div>
                                </div>
                            )}

                            {/* Typography */}
                            {designSystem.typography && (
                                <div className="bg-white border border-slate-200 rounded-lg p-4">
                                    <h4 className="font-bold text-slate-800 mb-3 text-sm">Typography</h4>
                                    {designSystem.typography.philosophy && (
                                        <p className="text-xs text-slate-600 mb-3">{designSystem.typography.philosophy}</p>
                                    )}
                                    <div className="space-y-2 text-sm">
                                        {designSystem.typography.headingFont && (
                                            <div>
                                                <span className="font-semibold text-slate-700">Headings:</span>
                                                <span className="text-slate-600 ml-2">{designSystem.typography.headingFont}</span>
                                            </div>
                                        )}
                                        {designSystem.typography.bodyFont && (
                                            <div>
                                                <span className="font-semibold text-slate-700">Body:</span>
                                                <span className="text-slate-600 ml-2">{designSystem.typography.bodyFont}</span>
                                            </div>
                                        )}
                                        {designSystem.typography.scale && (
                                            <div>
                                                <span className="font-semibold text-slate-700 block mb-1">Scale:</span>
                                                <span className="text-slate-600 font-mono text-xs">{designSystem.typography.scale}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Spacing & Grid */}
                            {designSystem.spacing && (
                                <div className="bg-white border border-slate-200 rounded-lg p-4">
                                    <h4 className="font-bold text-slate-800 mb-3 text-sm">Spacing & Grid</h4>
                                    <div className="space-y-2 text-sm">
                                        {designSystem.spacing.baseUnit && (
                                            <div>
                                                <span className="font-semibold text-slate-700">Base Unit:</span>
                                                <span className="text-slate-600 ml-2">{designSystem.spacing.baseUnit}</span>
                                            </div>
                                        )}
                                        {designSystem.spacing.gridColumns && (
                                            <div>
                                                <span className="font-semibold text-slate-700">Grid:</span>
                                                <span className="text-slate-600 ml-2">{designSystem.spacing.gridColumns}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Shadows & Effects */}
                            {designSystem.shadows && (
                                <div className="bg-white border border-slate-200 rounded-lg p-4">
                                    <h4 className="font-bold text-slate-800 mb-3 text-sm">Shadows</h4>
                                    <div className="space-y-1 text-xs text-slate-600">
                                        {Object.entries(designSystem.shadows).map(([key, value]: [string, any]) => (
                                            <div key={key}><span className="font-semibold">{key}:</span> {value}</div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* COMPONENT LIBRARY TAB */}
                    {activeTab === 'components' && (
                        <div className="space-y-3">
                            {designSystem.keyComponents && designSystem.keyComponents.length > 0 ? (
                                designSystem.keyComponents.map((comp: any, idx: number) => (
                                    <div key={idx} className="bg-white border border-slate-200 rounded-lg p-4">
                                        <h5 className="font-bold text-slate-800 mb-2">{comp.name || comp}</h5>
                                        {comp.description && <p className="text-sm text-slate-600">{comp.description}</p>}
                                        {comp.variants && (
                                            <div className="mt-2">
                                                <p className="text-xs font-semibold text-slate-600 mb-1">Variants:</p>
                                                <div className="flex flex-wrap gap-1">
                                                    {comp.variants.split(', ').map((v: string, i: number) => (
                                                        <span key={i} className="bg-slate-100 text-slate-700 px-2 py-1 rounded text-xs">
                                                            {v}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))
                            ) : (
                                <EmptyState message="No component library data" />
                            )}
                        </div>
                    )}

                    {/* VISUAL REFERENCES TAB */}
                    {activeTab === 'references' && (
                        <div className="space-y-3">
                            {visualReferences.length > 0 ? (
                                visualReferences.map((ref: any, idx: number) => (
                                    <div key={idx} className="bg-white border border-slate-200 rounded-lg p-4">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex-1">
                                                <h5 className="font-bold text-slate-800 mb-1">{ref.name}</h5>
                                                <p className="text-sm text-slate-600 mb-2">{ref.why}</p>
                                                {ref.elements && ref.elements.length > 0 && (
                                                    <div className="flex flex-wrap gap-1">
                                                        {ref.elements.map((el: string, i: number) => (
                                                            <span key={i} className="bg-indigo-100 text-indigo-700 px-2 py-1 rounded text-xs">
                                                                {el}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                            {ref.url && (
                                                <a
                                                    href={ref.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-indigo-600 hover:text-indigo-700 text-xs font-semibold whitespace-nowrap"
                                                >
                                                    Visit →
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <EmptyState message="No visual references found" />
                            )}
                        </div>
                    )}

                    {/* ACCESSIBILITY & RESPONSIVE TAB */}
                    {activeTab === 'accessibility' && (
                        <div className="space-y-4">
                            {accessibility && Object.keys(accessibility).length > 0 && (
                                <>
                                    <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                                        <h5 className="font-bold text-slate-800 mb-3">WCAG Compliance</h5>
                                        <div className="space-y-2 text-sm">
                                            {accessibility.wcagLevel && (
                                                <div>
                                                    <span className="font-semibold text-slate-700">Level:</span>
                                                    <span className="text-slate-600 ml-2">{accessibility.wcagLevel}</span>
                                                </div>
                                            )}
                                            {accessibility.contrastRatios && (
                                                <div>
                                                    <span className="font-semibold text-slate-700 block mb-1">Contrast Ratios:</span>
                                                    <ul className="space-y-1 ml-3">
                                                        {Object.entries(accessibility.contrastRatios).map(([type, ratio]: [string, any]) => (
                                                            <li key={type} className="text-xs text-slate-600">
                                                                • {type}: {ratio}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {accessibility.keyFocusStates && (
                                        <div className="bg-white border border-slate-200 rounded-lg p-4">
                                            <h5 className="font-bold text-slate-800 mb-2">Focus States</h5>
                                            <p className="text-sm text-slate-600">{accessibility.keyFocusStates}</p>
                                        </div>
                                    )}

                                    {accessibility.mobileAccessibility && (
                                        <div className="bg-white border border-slate-200 rounded-lg p-4">
                                            <h5 className="font-bold text-slate-800 mb-2">Mobile Accessibility</h5>
                                            <p className="text-sm text-slate-600">{accessibility.mobileAccessibility}</p>
                                        </div>
                                    )}
                                </>
                            )}

                            {responsiveBreakpoints && Object.keys(responsiveBreakpoints).length > 0 && (
                                <div className="bg-white border border-slate-200 rounded-lg p-4">
                                    <h5 className="font-bold text-slate-800 mb-3">Responsive Breakpoints</h5>
                                    <div className="space-y-2">
                                        {Object.entries(responsiveBreakpoints).map(([size, details]: [string, any]) => (
                                            size !== 'approach' && (
                                                <div key={size} className="bg-slate-50 p-3 rounded">
                                                    <p className="font-semibold text-slate-800 text-sm capitalize mb-1">{size}</p>
                                                    <p className="text-xs text-slate-600">{typeof details === 'string' ? details : JSON.stringify(details)}</p>
                                                </div>
                                            )
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* PROTOTYPE TAB */}
                    {activeTab === 'prototype' && (
                        <div>
                            {prototype && prototype.trim().length > 0 ? (
                                <Suspense fallback={<div className="animate-pulse bg-slate-200 h-96 rounded-lg" />}>
                                    <PrototypeCard html={prototype} />
                                </Suspense>
                            ) : (
                                <EmptyState message="Prototype generation failed. Please re-run the designer role." />
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

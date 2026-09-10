import { KPI, DiscoveryQuestion, ProductData, RICEFeature, OKR, Assumption } from './types';

// --- Deep Search Helper ---
const findDeep = (obj: any, keys: string[]): any => {
    if (!obj || typeof obj !== 'object') return null;

    // Check current level
    for (const key of Object.keys(obj)) {
        if (keys.some(k => k.toLowerCase() === key.toLowerCase())) {
            return obj[key];
        }
    }

    // Search deeper
    for (const key of Object.keys(obj)) {
        if (typeof obj[key] === 'object') {
            const found = findDeep(obj[key], keys);
            if (found) return found;
        }
    }
    return null;
};

// --- Normalization Logic ---
export const normalizeProductData = (rawData: any): ProductData => {
    console.log('🔍 [PM NORMALIZATION] Raw data received:', JSON.stringify(rawData, null, 2));
    console.log('🔍 [PM NORMALIZATION] Raw data keys:', Object.keys(rawData));

    // CRITICAL: Handle nested productDetails structure from AI
    let workingData = rawData;

    // Unwrap dashboard if present
    if (rawData.dashboard) {
        console.log('✅ [PM NORMALIZATION] Found dashboard key, unwrapping...');
        workingData = rawData.dashboard;
    }

    // Check if productDetails exists and merge it to root level
    if (workingData.productDetails) {
        console.log('✅ [PM NORMALIZATION] Found productDetails key, merging...');
        workingData = {
            ...workingData,
            ...workingData.productDetails
        };
    }

    console.log('🔍 [PM NORMALIZATION] Working data keys after unwrapping:', Object.keys(workingData));

    // 1. Extract Core Data
    const summary = findDeep(workingData, ['summary', 'executiveSummary', 'visionStatement', 'resumen', 'resumenEjecutivo']) || workingData.summary;
    const vision = findDeep(workingData, ['vision', 'productVision', 'visionProducto', 'visión']) || '';
    const targetAudience = findDeep(workingData, ['targetAudience', 'audience', 'segments', 'audiencia', 'publicoObjetivo', 'target', 'idealCustomerProfile', 'icp']) || [];
    const keyFeatures = findDeep(workingData, ['keyFeatures', 'features', 'mvpFeatures', 'caracteristicas', 'funciones', 'funcionalidades']) || [];
    const successMetrics = findDeep(workingData, ['successMetrics', 'metrics', 'kpis', 'metricas', 'exito']) || [];

    // 2. Extract Strategy Data
    const roadmap = findDeep(workingData, ['roadmap', 'strategicRoadmap', 'timeline', 'hojaDeRuta', 'cronograma', 'fases']) || [];
    const prioritization = findDeep(workingData, ['prioritization', 'prioritizationMatrix', 'matrix', 'priorizacion', 'matriz', 'prioridades']) || [];
    const rawCompetitors = findDeep(workingData, ['competitors', 'competitiveLandscape', 'radar', 'competition', 'competencia', 'competidores']) || [];

    // Normalize competitors to RadarCompetitors format {attribute, ourProduct, competitorAvg, marketLeader}
    let competitors: any[] = [];
    if (Array.isArray(rawCompetitors) && rawCompetitors.length > 0) {
        // Check if data is already in correct radar format
        if (rawCompetitors[0].attribute) {
            competitors = rawCompetitors;
        }
        // Transform from {name, scores: {dimension: value}} format
        else if (rawCompetitors[0].name && rawCompetitors[0].scores) {
            // Collect all score dimensions
            const allDimensions = new Set<string>();
            rawCompetitors.forEach((c: any) => {
                if (c.scores && typeof c.scores === 'object') {
                    Object.keys(c.scores).forEach(d => allDimensions.add(d));
                }
            });
            // Find "our product" vs competitors
            const ourProduct = rawCompetitors.find((c: any) =>
                /our|nuestro|pilot/i.test(c.name)
            );
            const others = rawCompetitors.filter((c: any) => c !== ourProduct);

            competitors = Array.from(allDimensions).map(dim => ({
                attribute: dim.replace(/([A-Z])/g, ' $1').replace(/^./, (s: string) => s.toUpperCase()).trim(),
                ourProduct: ourProduct?.scores?.[dim] ? ourProduct.scores[dim] * 10 : 50,
                competitorAvg: others.length > 0
                    ? Math.round(others.reduce((sum: number, c: any) => sum + (c.scores?.[dim] || 5) * 10, 0) / others.length)
                    : 50,
                marketLeader: others.length > 0
                    ? Math.max(...others.map((c: any) => (c.scores?.[dim] || 5) * 10))
                    : 70,
            }));
        }
        // Passthrough other formats
        else {
            competitors = rawCompetitors;
        }
    }

    // 3. Extract KPIs
    let kpis: KPI[] = [];
    const rawKPIs = findDeep(workingData, ['kpis', 'keyMetrics', 'metricasClave']) || successMetrics;
    if (Array.isArray(rawKPIs)) {
        kpis = rawKPIs.slice(0, 4).map((k: any) => ({
            label: k.label || k.metric || k.name || 'Metric',
            value: k.value || k.target || 'TBD',
            trend: k.trend || 'neutral'
        }));
    }

    // 4. Extract Discovery Questions
    let discoveryQuestions: DiscoveryQuestion[] = [];
    const rawQuestions = findDeep(workingData, ['discoveryQuestions', 'questions', 'interactiveQuestions']);
    if (Array.isArray(rawQuestions)) {
        discoveryQuestions = rawQuestions.map((q: any) => ({
            id: q.id || Math.random().toString(36).substr(2, 9),
            question: q.question || q.text || String(q),
            context: q.context || q.rationale || ''
        }));
    } else {
        // Fallback: Check tabs
        const tabs = findDeep(workingData, ['tabs']) || [];
        const dTab = tabs.find((t: any) => t.type === 'interactive-questions' || t.id === 'discovery');
        if (dTab && dTab.data) {
            discoveryQuestions = dTab.data.map((q: any) => ({
                id: q.id || Math.random().toString(36).substr(2, 9),
                question: q.question || q.text || String(q),
                context: q.context || q.rationale || ''
            }));
        }
    }

    // 5. Extract Charts
    let charts: any[] = findDeep(workingData, ['charts']) || [];
    if (!Array.isArray(charts) || charts.length === 0) {
        const tabs = findDeep(workingData, ['tabs']) || [];
        const cTab = tabs.find((t: any) => t.type === 'charts' || t.id === 'charts');
        if (cTab && cTab.data) charts = cTab.data;
    }

    // ===== NEW: Option C — PM Command Center Fields =====

    // 6. Positioning Statement (Geoffrey Moore format)
    const positioningStatement = findDeep(workingData, [
        'positioningStatement', 'positioning', 'declaracionPosicionamiento',
        'productPositioning', 'posicionamiento'
    ]) || '';

    // 7. Jobs-to-be-Done
    let jtbd: string[] = [];
    const rawJtbd = findDeep(workingData, ['jtbd', 'jobsToBeDone', 'jobs', 'trabajosPorHacer']);
    if (Array.isArray(rawJtbd)) {
        jtbd = rawJtbd.map((j: any) => typeof j === 'string' ? j : j.job || j.description || String(j));
    } else if (typeof rawJtbd === 'string') {
        jtbd = [rawJtbd];
    }

    // 8. RICE Features (with scoring)
    let riceFeatures: RICEFeature[] = [];
    const rawRice = findDeep(workingData, ['riceFeatures', 'rice', 'riceScoring', 'featurePrioritization']);
    if (Array.isArray(rawRice)) {
        riceFeatures = rawRice.map((f: any) => ({
            name: f.name || f.feature || 'Feature',
            description: f.description || '',
            reach: Number(f.reach) || 5,
            impact: Number(f.impact) || 5,
            confidence: Number(f.confidence) || 5,
            effort: Number(f.effort) || 5,
            riceScore: f.riceScore || Math.round((Number(f.reach || 5) * Number(f.impact || 5) * Number(f.confidence || 5)) / Math.max(Number(f.effort || 5), 1)),
            inMVP: f.inMVP !== undefined ? f.inMVP : true
        }));
    }

    // 9. MVP In/Out Scope
    let mvpInScope: string[] = [];
    let mvpOutOfScope: string[] = [];
    const rawInScope = findDeep(workingData, ['mvpInScope', 'inScope', 'included', 'enAlcance']);
    const rawOutOfScope = findDeep(workingData, ['mvpOutOfScope', 'outOfScope', 'excluded', 'fueraDeAlcance', 'notIncluded']);
    if (Array.isArray(rawInScope)) {
        mvpInScope = rawInScope.map((i: any) => typeof i === 'string' ? i : i.feature || i.name || String(i));
    }
    if (Array.isArray(rawOutOfScope)) {
        mvpOutOfScope = rawOutOfScope.map((i: any) => typeof i === 'string' ? i : `${i.feature || i.name || ''}: ${i.reason || i.rationale || ''}`.trim());
    }

    // 10. North Star Metric
    const northStarMetric = findDeep(workingData, [
        'northStarMetric', 'northStar', 'metricaEstrella', 'primaryMetric'
    ]) || '';

    // 11. OKRs (Objectives & Key Results)
    let okrs: OKR[] = [];
    const rawOkrs = findDeep(workingData, ['okrs', 'objectives', 'okr', 'objetivos']);
    if (Array.isArray(rawOkrs)) {
        okrs = rawOkrs.map((o: any) => ({
            objective: o.objective || o.name || o.objetivo || String(o),
            keyResults: Array.isArray(o.keyResults || o.krs || o.resultadosClave)
                ? (o.keyResults || o.krs || o.resultadosClave).map((kr: any) => typeof kr === 'string' ? kr : kr.description || kr.result || String(kr))
                : [],
            timeline: o.timeline || o.quarter || o.trimestre || ''
        }));
    }

    // 12. Assumptions / Hypotheses
    let assumptions: Assumption[] = [];
    const rawAssumptions = findDeep(workingData, ['assumptions', 'hypotheses', 'hipotesis', 'supuestos']);
    if (Array.isArray(rawAssumptions)) {
        assumptions = rawAssumptions.map((a: any) => ({
            hypothesis: a.hypothesis || a.assumption || a.hipotesis || String(a),
            risk: (['high', 'medium', 'low'].includes(a.risk?.toLowerCase?.()) ? a.risk.toLowerCase() : 'medium') as 'high' | 'medium' | 'low',
            validation: a.validation || a.howToValidate || a.validacion || ''
        }));
    }

    const result: ProductData = {
        summary, kpis, vision, targetAudience, keyFeatures,
        discoveryQuestions, successMetrics, charts,
        roadmap, prioritization, competitors,
        // New Option C fields
        positioningStatement,
        jtbd,
        riceFeatures,
        mvpInScope,
        mvpOutOfScope,
        northStarMetric,
        okrs,
        assumptions
    };

    console.log('✅ [PM NORMALIZATION] Final normalized result:', JSON.stringify(result, null, 2));

    return result;
};

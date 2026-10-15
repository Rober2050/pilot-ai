import { TourConfig } from '../../types/academy-schema';

export const HOW_IT_WORKS_CONFIG: TourConfig = {
  id: 'how-it-works',
  role: 'Arquitectura de Plataforma',
  title: 'Cómo funciona PILOT AI',
  description: 'Una mirada técnica y visual a la orquestación de agentes de IA',
  icon: 'Cpu',
  layout: 'sidebar',
  theme: {
    primary: '#06b6d4',
    secondary: '#8b5cf6',
    gradient: 'from-cyan-900/20 via-slate-950 to-purple-900/20',
  },
  stages: [
    // ─── STEP 1: PROCESS FLOW (Input & Gatekeeper) ────────────────────────
    {
      id: 'stage-1-genesis',
      type: 'process-flow',
      title: 'Fase 1: Entrada y Validación',
      subtitle: 'El Gatekeeper de IA',
      description: 'En esta fase inicial, la información del usuario (ya sea un PDF, un audio o simplemente texto) es recibida por nuestro Gatekeeper. Este filtro de seguridad e inteligencia extrae la intención principal, valida la lógica y consolida la información en un formato JSON inicial que se guarda en una Vector Database, formando el "Contexto Master".',
      duration: 6,
      nodes: [
        { id: 'user', label: 'Usuario', icon: 'User', type: 'circle', x: 100, y: 200, color: '#0ea5e9' },
        { id: 'input', label: 'Input Multi-modal', sublabel: 'Idea, PDF, Audio', icon: 'UploadCloud', type: 'document', x: 350, y: 200, color: '#8b5cf6' },
        { id: 'gatekeeper', label: 'AI Gatekeeper', sublabel: 'Validación Lógica', icon: 'ShieldCheck', type: 'diamond', x: 650, y: 200, color: '#f43f5e' },
        { id: 'schema', label: 'JSON Schema', sublabel: 'Estructuración', icon: 'Code', type: 'rect', x: 900, y: 200, color: '#eab308' },
        { id: 'db', label: 'Contexto Master', sublabel: 'Vector Database', icon: 'Database', type: 'database', x: 1150, y: 200, color: '#10b981' }
      ],
      connections: [
        { from: 'user', to: 'input', style: 'solid', color: '#0ea5e9' },
        { from: 'input', to: 'gatekeeper', style: 'dashed', color: '#8b5cf6' },
        { from: 'gatekeeper', to: 'schema', style: 'solid', color: '#f43f5e' },
        { from: 'schema', to: 'db', label: 'Datos Validados', style: 'solid', color: '#10b981' }
      ]
    },

    // ─── STEP 2: PROCESS FLOW (Specialist Agent Chaining) ─────────────────
    {
      id: 'stage-2-chaining',
      type: 'process-flow',
      title: 'Fase 2: Cadena de Agentes Especialistas',
      subtitle: 'Razonamiento Secuencial e Interacción',
      description: 'Una vez que tenemos el Contexto Master, los Agentes Especialistas de PILOT AI toman el control en secuencia. El Agente de Mercado cruza datos competitivos; el Agente Estratega define el modelo de negocio y posicionamiento; finalmente, el Agente Técnico diseña la arquitectura del software. Cada uno aporta sus insights al JSON principal.',
      duration: 8,
      nodes: [
        { id: 'ctx', label: 'Contexto Master', icon: 'Database', type: 'database', x: 150, y: 200, color: '#10b981' },
        { id: 'market', label: 'Agente Mercado', sublabel: 'Análisis de Competencia', icon: 'LineChart', type: 'circle', x: 450, y: 100, color: '#3b82f6' },
        { id: 'strategy', label: 'Agente Estrategia', sublabel: 'Posicionamiento', icon: 'Target', type: 'circle', x: 750, y: 200, color: '#8b5cf6' },
        { id: 'tech', label: 'Agente Técnico', sublabel: 'Arquitectura', icon: 'Cpu', type: 'circle', x: 1050, y: 100, color: '#ec4899' }
      ],
      connections: [
        { from: 'ctx', to: 'market', style: 'solid', color: '#10b981' },
        { from: 'market', to: 'strategy', label: 'Suma Insights', style: 'dashed', color: '#3b82f6' },
        { from: 'strategy', to: 'tech', label: 'Propone Modelo', style: 'dashed', color: '#8b5cf6' }
      ]
    },

    // ─── STEP 3: PROCESS FLOW (anti-hallucination guard) ──────────────────
    {
      id: 'stage-3-grounding',
      type: 'process-flow',
      title: 'Fase 3: Control Anti-Alucinación',
      subtitle: 'Estimaciones marcadas, sin búsquedas inventadas',
      description: 'Los agentes trabajan con el conocimiento del modelo, sin acceso a internet. Por eso cada cifra de mercado se marca como estimación con su año de referencia, las fuentes se citan solo si son conocidas y nunca se inventan URLs. El resultado es un payload JSON que distingue datos de supuestos.',
      duration: 7,
      nodes: [
        { id: 'agents', label: 'Agentes IA', sublabel: 'Motor de Inferencia', icon: 'BrainCircuit', type: 'circle', x: 200, y: 200, color: '#8b5cf6' },
        { id: 'api', label: 'API Gateway', sublabel: 'REST endpoints', icon: 'Network', type: 'rect', x: 500, y: 200, color: '#06b6d4' },
        { id: 'google', label: 'Guardia Anti-Alucinación', sublabel: 'Estimaciones marcadas', icon: 'Globe', type: 'diamond', x: 800, y: 100, color: '#eab308' },
        { id: 'data', label: 'Respuesta', sublabel: 'JSON Payload', icon: 'FileJson', type: 'document', x: 1100, y: 200, color: '#10b981' }
      ],
      connections: [
        { from: 'agents', to: 'api', style: 'solid', color: '#8b5cf6' },
        { from: 'api', to: 'google', label: 'Valida supuestos', style: 'dashed', color: '#06b6d4' },
        { from: 'google', to: 'data', style: 'solid', color: '#eab308' },
        { from: 'data', to: 'agents', label: 'Marca estimaciones', style: 'solid', color: '#10b981' }
      ]
    },

    // ─── STEP 4: BAR CHART (Accumulative Intelligence) ─────────────────────
    {
      id: 'stage-4-accumulation',
      type: 'bar-chart',
      title: 'Fase 4: Inteligencia Compuesta',
      subtitle: 'El valor estratégico crece en cada iteración',
      description: 'Este gráfico ilustra cómo el valor del Blueprint va creciendo. Comenzamos con un contexto base (Gatekeeper). Luego, el Agente de Mercado suma la visión competitiva. El Agente de Estrategia consolida el modelo de negocio, y el Agente Técnico sella el diseño, logrando un Blueprint final 100% integral.',
      duration: 6,
      data: [
        { label: 'Gatekeeper', value: 20, secondaryValue: 'Contexto Base', color: 'cyan', heightPercentage: 20 },
        { label: 'Mercado', value: 45, secondaryValue: '+ Visión Competitiva', color: 'purple', heightPercentage: 45 },
        { label: 'Estrategia', value: 75, secondaryValue: '+ Modelo Negocio', color: 'amber', heightPercentage: 75 },
        { label: 'Técnico', value: 100, secondaryValue: 'Blueprint Final', color: 'emerald', heightPercentage: 100 }
      ],
      yAxisLabels: ['0%', '25%', '50%', '75%', '100%'],
      legend: [
        { label: 'Nivel de Profundidad del Análisis' }
      ]
    },

    // ─── STEP 5: PROCESS FLOW (Artifact Factory) ──────────────────────────
    {
      id: 'stage-5-artifacts',
      type: 'process-flow',
      title: 'Fase 5: Generación de Artefactos',
      subtitle: 'De JSON Estructurado a Entregables Profesionales',
      description: 'Con el Master JSON consolidado (AST), nuestro sistema compila en paralelo todos los entregables. Usamos conversores especializados (docx template, xlsx parser, pptx compiler y React Flow) para que la inteligencia abstracta se transforme mágicamente en tus documentos Word, Excel, presentaciones y mapas de arquitectura interactivos.',
      duration: 8,
      nodes: [
        { id: 'json', label: 'Master JSON', sublabel: 'AST / Blueprint', icon: 'Braces', type: 'database', x: 200, y: 150, color: '#f59e0b' },
        { id: 'doc', label: 'Docs Word', sublabel: 'docx template', icon: 'FileText', type: 'document', x: 700, y: 80, color: '#3b82f6' },
        { id: 'xls', label: 'Reportes Excel', sublabel: 'xlsx parser', icon: 'FileSpreadsheet', type: 'document', x: 1050, y: 80, color: '#10b981' },
        { id: 'ppt', label: 'Presentaciones', sublabel: 'pptx compiler', icon: 'Presentation', type: 'document', x: 700, y: 250, color: '#f43f5e' },
        { id: 'diagram', label: 'React Flow', sublabel: 'canvas render', icon: 'Workflow', type: 'rect', x: 1050, y: 250, color: '#8b5cf6' }
      ],
      connections: [
        { from: 'json', to: 'doc', style: 'solid', color: '#f59e0b' },
        { from: 'json', to: 'xls', style: 'solid', color: '#f59e0b' },
        { from: 'json', to: 'ppt', style: 'solid', color: '#f59e0b' },
        { from: 'json', to: 'diagram', style: 'solid', color: '#f59e0b' }
      ]
    }
  ]
};

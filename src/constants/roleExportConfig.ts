/**
 * roleExportConfig.ts — SINGLE SOURCE OF TRUTH for role export configuration.
 *
 * All export generators (PPT, DOCX, PDF, Excel) consume this file.
 * ROLE_COLORS is no longer defined in pptHelpers, docxGenerator, or pdfGenerator.
 *
 * Adding a new role:
 *  1. Add one entry to ROLE_EXPORT_PROFILES below.
 *  2. If pptTier = 'premium', also add the generator to exportRegistry.ts.
 *  3. No other file needs to change.
 */

export interface RoleExportProfile {
  /** Canonical role identifier — must match RoleConfig.roleId */
  roleId: string;

  /**
   * Primary brand color used in PPT slides.
   * Tailwind-400/500 level: bright enough for slide accents on white backgrounds.
   * Matches the color shown in the role card in the UI.
   * Hex string WITHOUT leading #.
   */
  color: string;

  /**
   * Lighter variant of the brand color.
   * Used for PPT chart fills, gradient end-caps, secondary accents.
   */
  colorLight: string;

  /**
   * Very pale tint of the brand color.
   * Used for PPT card backgrounds and section fills.
   */
  colorPale: string;

  /**
   * Ultra-soft tint for the PPT cover slide background.
   * Almost white — just enough to suggest the role identity.
   */
  coverBg: string;

  /**
   * Darker variant for DOCX and PDF documents.
   * Tailwind-600/700 level: darker shade provides legibility on paper.
   * Intentionally different from `color` — projector and paper have different contrast needs.
   */
  documentColor: string;

  /**
   * Excel header row color.
   * Tailwind-700/800 level: dark enough to hold white text in spreadsheet cells.
   */
  excelHeaderColor: string;

  /**
   * PPT generator tier:
   * - 'premium': role has a specialized generator registered in exportRegistry.ts
   * - 'generic': uses genericRolePPT automatically — no registry entry needed
   */
  pptTier: 'premium' | 'generic';

  /**
   * Document title shown on the cover page of DOCX and PDF exports.
   * Describes the TYPE of document (not the role name).
   * e.g. "Análisis Funcional Completo" instead of "Business Analyst"
   */
  documentTitle: string;

  /**
   * Document subtitle — one-liner that complements the title.
   * e.g. "Documento de Requerimientos"
   */
  documentSubtitle: string;
}

export const ROLE_EXPORT_PROFILES: Record<string, RoleExportProfile> = {
  'strategy-analyst': {
    roleId:            'strategy-analyst',
    color:             'FACC15',   // yellow-400
    colorLight:        'FACC15',
    colorPale:         'FEF9C3',
    coverBg:           'FEFCE8',
    documentColor:     'CA8A04',   // yellow-600
    excelHeaderColor:  '92400E',
    pptTier:           'premium',
    documentTitle:     'Análisis Estratégico',
    documentSubtitle:  'Diagnóstico y Hoja de Ruta',
  },
  'product-manager': {
    roleId:            'product-manager',
    color:             'A855F7',   // purple-500
    colorLight:        'A78BFA',
    colorPale:         'EDE9FE',
    coverBg:           'FAF5FF',
    documentColor:     '7C3AED',   // purple-600
    excelHeaderColor:  '5B21B6',
    pptTier:           'premium',
    documentTitle:     'Documento de Producto',
    documentSubtitle:  'Roadmap y Especificación',
  },
  'business-analyst': {
    roleId:            'business-analyst',
    color:             '06B6D4',   // cyan-500
    colorLight:        '2DD4BF',
    colorPale:         'CCFBF1',
    coverBg:           'ECFEFF',
    documentColor:     '0D9488',   // teal-600
    excelHeaderColor:  '0E7490',
    pptTier:           'generic',
    documentTitle:     'Análisis Funcional Completo',
    documentSubtitle:  'Documento de Requerimientos',
  },
  'project-manager': {
    roleId:            'project-manager',
    color:             '22C55E',   // green-500
    colorLight:        '4ADE80',
    colorPale:         'DCFCE7',
    coverBg:           'F0FDF4',
    documentColor:     '16A34A',   // green-600
    excelHeaderColor:  '15803D',
    pptTier:           'generic',
    documentTitle:     'Plan de Proyecto',
    documentSubtitle:  'Gestión y Planificación',
  },
  'marketing-manager': {
    roleId:            'marketing-manager',
    color:             'EC4899',   // pink-500
    colorLight:        'FB7185',
    colorPale:         'FFE4E6',
    coverBg:           'FDF2F8',
    documentColor:     'E11D48',   // rose-600
    excelHeaderColor:  'BE185D',
    pptTier:           'generic',
    documentTitle:     'Plan de Marketing Estratégico',
    documentSubtitle:  'Análisis de Mercado',
  },
  'architect': {
    roleId:            'architect',
    color:             '3B82F6',   // blue-500
    colorLight:        '60A5FA',
    colorPale:         'DBEAFE',
    coverBg:           'EFF6FF',
    documentColor:     '2563EB',   // blue-600
    excelHeaderColor:  '1D4ED8',
    pptTier:           'generic',
    documentTitle:     'Arquitectura de Software',
    documentSubtitle:  'Decisiones Técnicas y ADRs',
  },
  'ux-designer': {
    roleId:            'ux-designer',
    color:             '6366F1',   // indigo-500
    colorLight:        '818CF8',
    colorPale:         'E0E7FF',
    coverBg:           'EEF2FF',
    documentColor:     '4338CA',   // indigo-700
    excelHeaderColor:  '3730A3',
    pptTier:           'generic',
    documentTitle:     'Informe de Experiencia de Usuario',
    documentSubtitle:  'Diseño y Estrategia UX',
  },
  'qa-engineer': {
    roleId:            'qa-engineer',
    color:             '10B981',   // emerald-500
    colorLight:        '34D399',
    colorPale:         'D1FAE5',
    coverBg:           'ECFDF5',
    documentColor:     '059669',   // emerald-600
    excelHeaderColor:  '065F46',
    pptTier:           'generic',
    documentTitle:     'Plan de Testing y Calidad',
    documentSubtitle:  'Estrategia de Aseguramiento QA',
  },
  'devops-engineer': {
    roleId:            'devops-engineer',
    color:             'F97316',   // orange-500
    colorLight:        'FB923C',   // orange-400
    colorPale:         'FFEDD5',   // orange-100
    coverBg:           'FFF7ED',   // orange-50
    documentColor:     'EA580C',   // orange-600
    excelHeaderColor:  'C2410C',   // orange-700
    pptTier:           'premium',
    documentTitle:     'Plan DevOps e Infraestructura',
    documentSubtitle:  'CI/CD, Observabilidad y Cloud Strategy',
  },
};

/** Fallback profile when roleId is not registered — prevents undefined errors */
export const DEFAULT_EXPORT_PROFILE: RoleExportProfile = {
  roleId:            'unknown',
  color:             '4F46E5',
  colorLight:        '818CF8',
  colorPale:         'E0E7FF',
  coverBg:           'EEF2FF',
  documentColor:     '4338CA',
  excelHeaderColor:  '3730A3',
  pptTier:           'generic',
  documentTitle:     'Informe de Análisis',
  documentSubtitle:  'Documento Generado por IA',
};

/**
 * Safe lookup — never returns undefined.
 * Use this everywhere instead of ROLE_EXPORT_PROFILES[roleId] directly.
 */
export function getRoleExportProfile(roleId: string): RoleExportProfile {
  return ROLE_EXPORT_PROFILES[roleId] ?? DEFAULT_EXPORT_PROFILE;
}

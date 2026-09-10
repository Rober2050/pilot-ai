/**
 * exportRegistry.ts — Role → PPT Generator Registry
 *
 * This is the ONLY place that knows which roles have specialized PPT generators.
 * All other files (pptGenerator.ts, ResultsWorkspace.tsx) are role-agnostic.
 *
 * Adding a premium PPT for a new role (e.g. 'devops-engineer'):
 *   1. Create src/services/export/ppt/roles/devopsEngineerPPT.ts
 *   2. Add one entry to PPT_ROLE_REGISTRY below
 *   3. Set pptTier: 'premium' in roleExportConfig.ts
 *   4. No other file needs to change
 */

import { RoleConfig } from '../../types/roles';
import { NormalizedDocument } from './contentNormalizer';

/**
 * Contract that every specialized PPT generator must fulfill.
 * The `content` parameter is raw JSON (as returned by the AI) for all registered roles.
 * Each generator is responsible for its own data extraction / normalization internally.
 */
export interface RolePPTGenerator {
  generate(
    content: any,
    roleConfig: RoleConfig,
    lang: 'es' | 'en',
    projectName: string
  ): Promise<void>;
}

/**
 * Internal adapter that wraps a generator expecting NormalizedDocument
 * so that it can receive rawContent from the unified call site.
 */
async function normalizeAndGenerate(
  rawContent: any,
  roleConfig: RoleConfig,
  lang: 'es' | 'en',
  projectName: string,
  generatorFn: (normalizedDoc: NormalizedDocument, roleConfig: RoleConfig, lang: 'es' | 'en', projectName: string) => Promise<void>
): Promise<void> {
  const { normalizeRoleOutput } = await import('./contentNormalizer');
  const normalizedDoc = normalizeRoleOutput(
    roleConfig.roleId,
    roleConfig.displayName,
    rawContent,
    projectName,
    lang
  );
  return generatorFn(normalizedDoc, roleConfig, lang, projectName);
}

/**
 * Registry: maps roleId → factory that returns a RolePPTGenerator.
 * Lazy imports preserve the dynamic-import performance optimization —
 * the ~460 KB PPT bundle only loads when the user clicks download.
 */
const PPT_ROLE_REGISTRY: Record<string, () => Promise<RolePPTGenerator>> = {
  /**
   * Strategy Analyst: ultra-premium 10-slide executive format.
   * Accepts rawContent directly (not normalized) — the generator
   * extracts data from the AI JSON internally.
   */
  'strategy-analyst': async () => {
    const { strategyAnalystPPT } = await import('./ppt/roles/strategyAnalystPPT');
    return {
      generate: (rawContent, roleConfig, lang, projectName) =>
        strategyAnalystPPT.generate(rawContent, roleConfig, lang, projectName),
    };
  },

  /**
   * Product Manager: premium specialized format (roadmap, RICE matrix, competitive).
   * Expects NormalizedDocument internally — the adapter normalizes rawContent first.
   */
  'product-manager': async () => {
    const { productManagerPPT } = await import('./ppt/roles/productManagerPPT');
    return {
      generate: (rawContent, roleConfig, lang, projectName) =>
        normalizeAndGenerate(rawContent, roleConfig, lang, projectName,
          (normalized, rc, l, p) => productManagerPPT.generate(normalized, rc, l, p)
        ),
    };
  },

  /**
   * Business Analyst: specialist format (KPI dashboard, requirements table,
   * user stories 2-col, business rules). Reads rawContent directly.
   */
  'business-analyst': async () => {
    const { businessAnalystPPT } = await import('./ppt/roles/businessAnalystPPT');
    return {
      generate: (rawContent, roleConfig, lang, projectName) =>
        businessAnalystPPT.generate(rawContent, roleConfig, lang, projectName),
    };
  },

  /**
   * Project Manager: specialist format (KPI dashboard, project timeline/phases,
   * team & resources, deliverables agenda, tech stack). Reads rawContent directly.
   * Handles PPT_PROTOCOL slides[], EXCEL_PROTOCOL excel_data[], CHART_PROTOCOL charts[].
   */
  'project-manager': async () => {
    const { projectManagerPPT } = await import('./ppt/roles/projectManagerPPT');
    return {
      generate: (rawContent, roleConfig, lang, projectName) =>
        projectManagerPPT.generate(rawContent, roleConfig, lang, projectName),
    };
  },

  /**
   * Software Architect: specialist format (KPI, ADRs table, Quality Attributes,
   * Tech Radar, stripped markdown detail). Reads rawContent.dashboard directly.
   * Eliminates duplicate summaries and raw markdown overflow.
   */
  'architect': async () => {
    const { architectPPT } = await import('./ppt/roles/architectPPT');
    return {
      generate: (rawContent, roleConfig, lang, projectName) =>
        architectPPT.generate(rawContent, roleConfig, lang, projectName),
    };
  },

  /**
   * UX/UI Designer: specialist format parses the HTML prototype to extract C-Level content.
   * Protocol returns { prototype: "<!DOCTYPE html>..." } — no dashboard, no tabs.
   * Slides: Cover → Design Strategy → Page Structure → Visual Identity →
   *         Key Messages → Value Proposition → Prototype Summary → Closing.
   */
  'ux-designer': async () => {
    const { uxDesignerPPT } = await import('./ppt/roles/uxDesignerPPT');
    return {
      generate: (rawContent, roleConfig, lang, projectName) =>
        uxDesignerPPT.generate(rawContent, roleConfig, lang, projectName),
    };
  },

  /**
   * Marketing Manager: specialist format (Unit Economics KPIs, Channel Strategy table,
   * ROAS Scenarios 3-col cards, Buyer Persona 2-col, Messaging Framework, Competitive Map).
   * Reads rawContent directly (no `dashboard` wrapper — Marketing protocol has root-level keys).
   * Eliminates duplicate summaries and sparse content from genericRolePPT.
   */
  'marketing-manager': async () => {
    const { marketingManagerPPT } = await import('./ppt/roles/marketingManagerPPT');
    return {
      generate: (rawContent, roleConfig, lang, projectName) =>
        marketingManagerPPT.generate(rawContent, roleConfig, lang, projectName),
    };
  },

  /**
   * QA Engineer: specialist format (Quality KPIs, Critical Scenarios table, Risk Matrix,
   * Critical User Journeys 2-col, Testing Pyramid 3-card, QA Tech Stack table).
   * Reads rawContent.dashboard directly — QA_PROTOCOL uses direct named fields (no tabs).
   * Eliminates duplicate "Resumen Ejecutivo" and blank table slides from genericRolePPT.
   */
  'qa-engineer': async () => {
    const { qaEngineerPPT } = await import('./ppt/roles/qaEngineerPPT');
    return {
      generate: (rawContent, roleConfig, lang, projectName) =>
        qaEngineerPPT.generate(rawContent, roleConfig, lang, projectName),
    };
  },

  /**
   * DevOps Engineer: specialist format (Infrastructure KPIs, CI/CD Pipeline table,
   * Monitoring & Observability table, Security & Compliance table, SLOs 3-col cards,
   * AWS Cost Estimate table). Reads rawContent.dashboard.tabs[] directly.
   * Eliminates empty slides from genericRolePPT for the tabs-based protocol.
   */
  'devops-engineer': async () => {
    const { devopsEngineerPPT } = await import('./ppt/roles/devopsEngineerPPT');
    return {
      generate: (rawContent, roleConfig, lang, projectName) =>
        devopsEngineerPPT.generate(rawContent, roleConfig, lang, projectName),
    };
  },
};

/**
 * Resolves the specialized PPT generator for a role.
 * Returns null for generic-tier roles — the caller falls back to genericRolePPT.
 */
export async function resolvePPTGenerator(roleId: string): Promise<RolePPTGenerator | null> {
  const factory = PPT_ROLE_REGISTRY[roleId];
  if (!factory) return null;
  return factory();
}

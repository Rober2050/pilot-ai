import { RoleConfig } from '../../types/roles';
import { genericRolePPT } from './ppt/genericRolePPT';
import { resolvePPTGenerator } from './exportRegistry';

/**
 * PPT Generator (Router)
 * Role dispatch is handled by exportRegistry — no if/else chains here.
 * To add a new premium role: add an entry to exportRegistry.ts only.
 */

const generateRolePPT = async (
  rawContent: any,
  roleConfig: RoleConfig,
  lang: 'es' | 'en' = 'es',
  projectName: string = 'Project'
) => {
  // Registry resolves premium generators (strategy-analyst, product-manager, etc.)
  const specialist = await resolvePPTGenerator(roleConfig.roleId);
  if (specialist) {
    return specialist.generate(rawContent, roleConfig, lang, projectName);
  }

  // Generic fallback: normalize then render
  const { normalizeRoleOutput } = await import('./contentNormalizer');
  const normalizedDoc = normalizeRoleOutput(
    roleConfig.roleId,
    roleConfig.displayName,
    rawContent,
    projectName,
    lang
  );
  return genericRolePPT.generate(normalizedDoc, roleConfig, lang);
};

export const pptGenerator = {
  generateRolePPT,
};

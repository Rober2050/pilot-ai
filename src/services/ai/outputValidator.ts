/**
 * Output Validators - Ensures AI-generated content meets quality standards
 * Validates structure, data types, ranges, and logical consistency
 */

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validates Strategy Analyst output
 */
export const validateStrategyAnalystOutput = (output: any): ValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required sections
  if (!output.dashboard) errors.push("Missing: dashboard section");
  if (!output.market) errors.push("Missing: market analysis");
  if (!output.recommendations) errors.push("Missing: recommendations");

  // Dashboard validation
  if (output.dashboard?.score !== undefined) {
    if (typeof output.dashboard.score !== 'number') {
      errors.push(`dashboard.score must be number, got ${typeof output.dashboard.score}`);
    } else if (output.dashboard.score < 0 || output.dashboard.score > 100) {
      errors.push(`dashboard.score out of range [0-100]: ${output.dashboard.score}`);
    }
  }

  // Verify KPIs have proper structure
  if (Array.isArray(output.dashboard?.kpis)) {
    output.dashboard.kpis.forEach((kpi: any, idx: number) => {
      if (!kpi.label) errors.push(`KPI[${idx}] missing label`);
      if (typeof kpi.value !== 'number') {
        errors.push(`KPI[${idx}].value must be number, got ${typeof kpi.value}`);
      }
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};

/**
 * Validates Product Manager output
 */
export const validateProductManagerOutput = (output: any): ValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!output.productStrategy) errors.push("Missing: productStrategy");
  if (!output.roadmap) errors.push("Missing: roadmap");
  if (!output.successMetrics) errors.push("Missing: successMetrics");

  // Validate roadmap phases have milestones
  if (Array.isArray(output.roadmap?.phases)) {
    output.roadmap.phases.forEach((phase: any, idx: number) => {
      if (!phase.name) errors.push(`Roadmap phase[${idx}] missing name`);
      if (!Array.isArray(phase.milestones) || phase.milestones.length === 0) {
        warnings.push(`Roadmap phase[${idx}] has no milestones`);
      }
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};

/**
 * Validates Business Analyst output
 */
export const validateBusinessAnalystOutput = (output: any): ValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!output.diagnosis) errors.push("Missing: diagnosis");
  if (!output.findings) errors.push("Missing: findings");

  // Validate findings have priority/impact
  if (Array.isArray(output.findings)) {
    output.findings.forEach((finding: any, idx: number) => {
      if (!finding.title) errors.push(`Finding[${idx}] missing title`);
      if (!finding.impact) warnings.push(`Finding[${idx}] missing impact assessment`);
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};

/**
 * Validates Project Manager output
 */
export const validateProjectManagerOutput = (output: any): ValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!output.projectCharter) errors.push("Missing: projectCharter");
  if (!output.taskBreakdown) errors.push("Missing: taskBreakdown");
  if (!output.timeline) errors.push("Missing: timeline");

  // Validate tasks have estimates
  if (Array.isArray(output.taskBreakdown?.tasks)) {
    output.taskBreakdown.tasks.forEach((task: any, idx: number) => {
      if (!task.name) errors.push(`Task[${idx}] missing name`);
      if (typeof task.estimatedDays !== 'number') {
        warnings.push(`Task[${idx}] missing estimatedDays`);
      }
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};

/**
 * Validates QA Engineer output
 */
export const validateQAEngineerOutput = (output: any): ValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!output.testStrategy) errors.push("Missing: testStrategy");
  if (!output.testCases) errors.push("Missing: testCases");

  // Validate test cases have steps
  if (Array.isArray(output.testCases)) {
    output.testCases.forEach((tc: any, idx: number) => {
      if (!tc.title) errors.push(`TestCase[${idx}] missing title`);
      if (!Array.isArray(tc.steps) || tc.steps.length === 0) {
        errors.push(`TestCase[${idx}] missing steps`);
      }
      if (!tc.expectedResult) warnings.push(`TestCase[${idx}] missing expectedResult`);
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};

/**
 * Generic validator for any role output
 */
export const validateGenericOutput = (output: any): ValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check that output is valid JSON object
  if (typeof output !== 'object' || output === null) {
    errors.push(`Output must be JSON object, got ${typeof output}`);
    return { isValid: false, errors, warnings };
  }

  // Check that it's not empty
  if (Object.keys(output).length === 0) {
    warnings.push("Output is empty object");
  }

  // Check for common hallucinations (very long fictional narratives)
  const outputStr = JSON.stringify(output);
  if (outputStr.length > 50000) {
    warnings.push("Output size is very large (>50KB) - may contain unnecessary content");
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};

/**
 * Master validator that routes to role-specific validators
 */
export const validateOutput = (output: any, roleId: string): ValidationResult => {
  switch (roleId) {
    case 'strategy-analyst':
      return validateStrategyAnalystOutput(output);
    case 'product-manager':
      return validateProductManagerOutput(output);
    case 'business-analyst':
      return validateBusinessAnalystOutput(output);
    case 'project-manager':
      return validateProjectManagerOutput(output);
    case 'qa-engineer':
      return validateQAEngineerOutput(output);
    default:
      return validateGenericOutput(output);
  }
};

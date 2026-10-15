-- ============================================================
-- 006 — Role prompts and subscription plans aligned with the real app
-- ============================================================
-- Prompts: a role's final system prompt is its DB persona + the protocol
-- injected from code (src/ai/protocols.ts, via promptEngine). The QA persona
-- carried TWO extra JSON schemas (a "projectPhases" dashboard and a generic
-- "tabs" one) on top of QA_PROTOCOL — three contradictory shapes, while the QA
-- dashboard only reads QA_PROTOCOL's fields. The persona now describes the
-- role and defers the structure to the protocol.
-- Language: prompts are written in English (output language is detected from
-- the user's request). The Business Analyst and Architect openings and the
-- Marketing sample labels were in Spanish.
--
-- Plans: limits still listed Gemini/GPT/Claude 3.5 models and the retired
-- frontend-dev/backend-dev roles. Every role runs on Claude Haiku 4.5.
-- ============================================================

UPDATE public.ai_roles
SET system_prompt = $prompt$You are an expert QA Engineer with 15+ years of experience in test strategy for digital products. Your goal is to produce the Master Test Plan and quality dashboard for the user's idea, building on the previous team analyses.

Focus on:
- The critical user journeys that must pass before launch, written as executable test cases (Given / When / Then).
- Realistic quality risks with probability, impact and a concrete mitigation.
- A pragmatic testing pyramid and QA stack sized to the team and the stage of the product.

The exact JSON structure is defined by the QA protocol that follows. Follow it exactly; do not add other top-level shapes.
Detect the language of the user's request (English or Spanish) and write all content in that language.$prompt$
WHERE id = 'qa-engineer';

UPDATE public.ai_roles
SET system_prompt = replace(
  system_prompt,
  'Eres un Experto Analista de Negocios. Tu objetivo es analizar los requisitos funcionales y no funcionales, e Historias de Usuario.',
  'You are an expert Business Analyst. Your goal is to analyze the functional and non-functional requirements and write the User Stories.'
)
WHERE id = 'business-analyst';

UPDATE public.ai_roles
SET system_prompt = replace(
  system_prompt,
  'Eres un Arquitecto de Software Senior experto. Diseña una arquitectura técnica robusta.',
  'You are an expert Senior Software Architect. Design a robust technical architecture.'
)
WHERE id = 'architect';

UPDATE public.ai_roles
SET system_prompt = replace(replace(replace(replace(replace(
  system_prompt,
  '"subject": "Ansiedad"', '"subject": "Anxiety"'),
  '"subject": "Ambición"', '"subject": "Ambition"'),
  '"subject": "Lealtad"', '"subject": "Loyalty"'),
  '"subject": "Precio"', '"subject": "Price"'),
  '"subject": "Innovación"', '"subject": "Innovation"')
WHERE id = 'marketing-manager';

-- ------------------------------------------------------------
-- Subscription plans
-- ------------------------------------------------------------
UPDATE public.subscription_plans
SET limits = jsonb_set(limits, '{allowedModels}', '["claude-haiku-4-5-20251001"]'::jsonb);

UPDATE public.subscription_plans
SET included_roles = '["strategy-analyst", "product-manager", "business-analyst", "project-manager", "marketing-manager", "architect", "ux-designer", "qa-engineer", "devops-engineer"]'::jsonb,
    features = '["All 9 AI roles", "Unlimited analyses", "Unlimited projects", "Team synthesis", "Export DOCX/Excel/PDF/PPT"]'::jsonb
WHERE id = 'enterprise';

UPDATE public.subscription_plans
SET features = '["2 AI roles", "1 analysis per month", "1 project", "Community support"]'::jsonb
WHERE id = 'free';

UPDATE public.subscription_plans
SET features = '["6 AI roles", "50 analyses per month", "10 projects", "Export DOCX/Excel/PDF"]'::jsonb
WHERE id = 'pro';

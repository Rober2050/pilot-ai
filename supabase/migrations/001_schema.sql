-- ============================================================
-- PILOT AI — Schema PostgreSQL para Supabase
-- Migración: 001_schema.sql
-- Basado en: Firestore original (southamerica-east1)
-- ============================================================

-- ============================================================
-- EXTENSIONES
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- LIMPIEZA (orden inverso por foreign keys)
-- ============================================================
DROP TABLE IF EXISTS public.audit_logs CASCADE;
DROP TABLE IF EXISTS public.waitlist CASCADE;
DROP TABLE IF EXISTS public.registration_requests CASCADE;
DROP TABLE IF EXISTS public.invitations CASCADE;
DROP TABLE IF EXISTS public.shared_blueprints CASCADE;
DROP TABLE IF EXISTS public.projects CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;
DROP TABLE IF EXISTS public.war_room_styles CASCADE;
DROP TABLE IF EXISTS public.subscription_plans CASCADE;
DROP TABLE IF EXISTS public.ai_roles CASCADE;
DROP TABLE IF EXISTS public.ai_models CASCADE;
DROP TABLE IF EXISTS public.system_config CASCADE;

-- ============================================================
-- FUNCIÓN: auto-actualizar updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- TABLA: ai_models
-- Modelos de IA disponibles (Claude, Gemini, GPT)
-- ============================================================
CREATE TABLE public.ai_models (
  id           TEXT PRIMARY KEY,
  model_name   TEXT NOT NULL,
  display_name TEXT NOT NULL,
  description  TEXT,
  provider     TEXT NOT NULL,
  is_active    BOOLEAN DEFAULT true,
  max_tokens   INTEGER,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER ai_models_updated_at
  BEFORE UPDATE ON public.ai_models
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================
-- TABLA: ai_roles
-- Los 11 agentes de PILOT AI con sus system prompts
-- ============================================================
CREATE TABLE public.ai_roles (
  id            TEXT PRIMARY KEY,
  display_name  TEXT NOT NULL,
  description   TEXT,
  model_id      TEXT REFERENCES public.ai_models(id),
  temperature   NUMERIC(3,2) DEFAULT 0.7,
  grounding     BOOLEAN DEFAULT false,
  gender        TEXT DEFAULT 'neutral',
  is_enabled    BOOLEAN DEFAULT true,
  order_index   NUMERIC(5,2) DEFAULT 0,
  system_prompt TEXT,
  doc_config    JSONB DEFAULT '{}'::jsonb,
  version       INTEGER DEFAULT 1,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER ai_roles_updated_at
  BEFORE UPDATE ON public.ai_roles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================
-- TABLA: subscription_plans
-- Planes free, pro, enterprise
-- ============================================================
CREATE TABLE public.subscription_plans (
  id               TEXT PRIMARY KEY,
  name             TEXT NOT NULL,
  price            NUMERIC(10,2) DEFAULT 0,
  currency         TEXT DEFAULT 'USD',
  billing_cycle    TEXT DEFAULT 'monthly',
  duration_value   INTEGER DEFAULT 1,
  is_active        BOOLEAN DEFAULT true,
  features         JSONB DEFAULT '[]'::jsonb,
  included_roles   JSONB DEFAULT '[]'::jsonb,
  limits           JSONB DEFAULT '{}'::jsonb,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER subscription_plans_updated_at
  BEFORE UPDATE ON public.subscription_plans
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================
-- TABLA: war_room_styles
-- Modos del War Room (8 estilos ES + EN)
-- ============================================================
CREATE TABLE public.war_room_styles (
  id           TEXT PRIMARY KEY,
  mode         TEXT UNIQUE NOT NULL,
  name         TEXT NOT NULL,
  name_en      TEXT NOT NULL,
  modifier     TEXT NOT NULL,
  modifier_en  TEXT NOT NULL,
  icon         TEXT,
  is_enabled   BOOLEAN DEFAULT true,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER war_room_styles_updated_at
  BEFORE UPDATE ON public.war_room_styles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================
-- TABLA: system_config
-- Configuración del sistema (SIN API keys — van en .env.local)
-- ============================================================
CREATE TABLE public.system_config (
  id         TEXT PRIMARY KEY,
  is_enabled BOOLEAN DEFAULT true,
  settings   JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLA: users
-- Perfiles de usuario (vinculado a Supabase Auth)
-- ============================================================
CREATE TABLE public.users (
  id                      UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email                   TEXT UNIQUE NOT NULL,
  display_name            TEXT,
  rol                     TEXT DEFAULT 'user',
  plan_id                 TEXT REFERENCES public.subscription_plans(id) DEFAULT 'free',
  subscription_plan       TEXT DEFAULT 'free',
  subscription_status     TEXT DEFAULT 'active',
  subscription_start_date TIMESTAMPTZ DEFAULT NOW(),
  subscription_end_date   TIMESTAMPTZ,
  status                  TEXT DEFAULT 'active',
  created_at              TIMESTAMPTZ DEFAULT NOW(),
  updated_at              TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_rol ON public.users(rol);
CREATE INDEX idx_users_plan_id ON public.users(plan_id);

-- ============================================================
-- TABLA: projects
-- Proyectos con blueprint completo en JSONB
-- ============================================================
CREATE TABLE public.projects (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  project_id   TEXT UNIQUE NOT NULL DEFAULT gen_random_uuid()::text,
  project_name TEXT NOT NULL,
  methodology  TEXT DEFAULT 'agile',
  language     TEXT DEFAULT 'es',
  status       TEXT DEFAULT 'in_progress',
  blueprint    JSONB DEFAULT '{}'::jsonb,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE INDEX idx_projects_user_id   ON public.projects(user_id);
CREATE INDEX idx_projects_project_id ON public.projects(project_id);
CREATE INDEX idx_projects_status     ON public.projects(status);
CREATE INDEX idx_projects_created_at ON public.projects(created_at DESC);

-- ============================================================
-- TABLA: shared_blueprints
-- Blueprints compartidos públicamente
-- ============================================================
CREATE TABLE public.shared_blueprints (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blueprint JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLA: invitations
-- Invitaciones pendientes de activación
-- ============================================================
CREATE TABLE public.invitations (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email                 TEXT UNIQUE NOT NULL,
  display_name          TEXT,
  plan_id               TEXT REFERENCES public.subscription_plans(id),
  role                  TEXT DEFAULT 'user',
  status                TEXT DEFAULT 'pending',
  subscription_end_date TIMESTAMPTZ,
  created_at            TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLA: registration_requests
-- Solicitudes de registro (formulario público)
-- ============================================================
CREATE TABLE public.registration_requests (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email           TEXT NOT NULL,
  name            TEXT,
  requested_plan  TEXT DEFAULT 'free',
  status          TEXT DEFAULT 'pending',
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLA: waitlist
-- Lista de espera para planes Pro/Enterprise
-- ============================================================
CREATE TABLE public.waitlist (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email      TEXT NOT NULL,
  plan       TEXT DEFAULT 'pro',
  source     TEXT,
  status     TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLA: audit_logs
-- Logs de uso y errores del sistema (simplificado)
-- ============================================================
CREATE TABLE public.audit_logs (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type       TEXT NOT NULL,
  level      TEXT DEFAULT 'info',
  message    TEXT,
  details    JSONB DEFAULT '{}'::jsonb,
  user_id    TEXT,
  source     TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_type       ON public.audit_logs(type);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_user_id    ON public.audit_logs(user_id);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

-- users: cada usuario ve solo su propio perfil
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_select_own" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "users_update_own" ON public.users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "users_insert_own" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- projects: cada usuario ve solo sus proyectos
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "projects_select_own" ON public.projects
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "projects_insert_own" ON public.projects
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "projects_update_own" ON public.projects
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "projects_delete_own" ON public.projects
  FOR DELETE USING (user_id = auth.uid());

-- shared_blueprints: lectura pública
ALTER TABLE public.shared_blueprints ENABLE ROW LEVEL SECURITY;

CREATE POLICY "shared_blueprints_select_all" ON public.shared_blueprints
  FOR SELECT USING (true);

-- Tablas de configuración: lectura pública (sin API keys)
ALTER TABLE public.ai_models ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ai_models_select_all" ON public.ai_models
  FOR SELECT USING (true);

ALTER TABLE public.ai_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ai_roles_select_all" ON public.ai_roles
  FOR SELECT USING (true);

ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "subscription_plans_select_all" ON public.subscription_plans
  FOR SELECT USING (true);

ALTER TABLE public.war_room_styles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "war_room_styles_select_all" ON public.war_room_styles
  FOR SELECT USING (true);

ALTER TABLE public.system_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "system_config_select_all" ON public.system_config
  FOR SELECT USING (true);

-- audit_logs: solo usuarios autenticados pueden insertar sus propios logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "audit_logs_insert_auth" ON public.audit_logs
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- ============================================================
-- FUNCIÓN: crear perfil de usuario automáticamente al registrarse
-- Se ejecuta cuando Supabase Auth crea un nuevo usuario
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, display_name, rol, plan_id)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'rol', 'user'),
    'free'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- FIN DEL SCHEMA
-- ============================================================

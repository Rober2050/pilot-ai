import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Legacy namespace — kept for backward compatibility until Phase 3 migration
import esTranslation from './locales/es.json';
import enTranslation from './locales/en.json';

// ─── Spanish namespaces ────────────────────────────────────────────────────
import esCommon from './locales/es/common.json';
import esRoles from './locales/es/roles.json';
import esDiagnostic from './locales/es/diagnostic.json';
import esAdmin from './locales/es/admin.json';
import esSettings from './locales/es/settings.json';
import esDashboard from './locales/es/dashboard.json';
import esInput from './locales/es/input.json';
import esErrors from './locales/es/errors.json';
import esPreview from './locales/es/preview.json';
import esAudioPreview from './locales/es/audioPreview.json';
import esContentBlock from './locales/es/contentBlock.json';
import esBusinessAnalyst from './locales/es/businessAnalyst.json';
import esAuth from './locales/es/auth.json';
import esSubscription from './locales/es/subscription.json';
import esMarketing from './locales/es/marketing.json';
import esQa from './locales/es/qa.json';
import esStrategy from './locales/es/strategy.json';
import esLanding from './locales/es/landing.json';
import esPricing from './locales/es/pricing.json';
import esFeatures from './locales/es/features.json';
import esFooter from './locales/es/footer.json';
import esProject from './locales/es/project.json';
import esPlanning from './locales/es/planning.json';
import esProduct from './locales/es/product.json';

// ─── English namespaces ───────────────────────────────────────────────────
import enCommon from './locales/en/common.json';
import enRoles from './locales/en/roles.json';
import enDiagnostic from './locales/en/diagnostic.json';
import enAdmin from './locales/en/admin.json';
import enSettings from './locales/en/settings.json';
import enDashboard from './locales/en/dashboard.json';
import enInput from './locales/en/input.json';
import enErrors from './locales/en/errors.json';
import enPreview from './locales/en/preview.json';
import enAudioPreview from './locales/en/audioPreview.json';
import enContentBlock from './locales/en/contentBlock.json';
import enBusinessAnalyst from './locales/en/businessAnalyst.json';
import enAuth from './locales/en/auth.json';
import enSubscription from './locales/en/subscription.json';
import enMarketing from './locales/en/marketing.json';
import enQa from './locales/en/qa.json';
import enStrategy from './locales/en/strategy.json';
import enLanding from './locales/en/landing.json';
import enPricing from './locales/en/pricing.json';
import enFeatures from './locales/en/features.json';
import enFooter from './locales/en/footer.json';
import enProject from './locales/en/project.json';
import enPlanning from './locales/en/planning.json';
import enProduct from './locales/en/product.json';

i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        ns: [
            'translation', // legacy — existing components use useTranslation() without args
            'common', 'roles', 'diagnostic', 'admin', 'settings',
            'dashboard', 'input', 'errors', 'preview', 'audioPreview',
            'contentBlock', 'businessAnalyst', 'auth', 'subscription',
            'marketing', 'qa', 'strategy', 'landing', 'pricing', 'features', 'footer',
            'project', 'planning', 'product'
        ],
        defaultNS: 'translation',
        resources: {
            es: {
                translation: esTranslation,
                common: esCommon,
                roles: esRoles,
                diagnostic: esDiagnostic,
                admin: esAdmin,
                settings: esSettings,
                dashboard: esDashboard,
                input: esInput,
                errors: esErrors,
                preview: esPreview,
                audioPreview: esAudioPreview,
                contentBlock: esContentBlock,
                businessAnalyst: esBusinessAnalyst,
                auth: esAuth,
                subscription: esSubscription,
                marketing: esMarketing,
                qa: esQa,
                strategy: esStrategy,
                landing: esLanding,
                pricing: esPricing,
                features: esFeatures,
                footer: esFooter,
                project: esProject,
                planning: esPlanning,
                product: esProduct
            },
            en: {
                translation: enTranslation,
                common: enCommon,
                roles: enRoles,
                diagnostic: enDiagnostic,
                admin: enAdmin,
                settings: enSettings,
                dashboard: enDashboard,
                input: enInput,
                errors: enErrors,
                preview: enPreview,
                audioPreview: enAudioPreview,
                contentBlock: enContentBlock,
                businessAnalyst: enBusinessAnalyst,
                auth: enAuth,
                subscription: enSubscription,
                marketing: enMarketing,
                qa: enQa,
                strategy: enStrategy,
                landing: enLanding,
                pricing: enPricing,
                features: enFeatures,
                footer: enFooter,
                project: enProject,
                planning: enPlanning,
                product: enProduct
            }
        },
        fallbackLng: 'es',
        interpolation: {
            escapeValue: false
        }
    });

export default i18n;

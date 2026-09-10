import { motion } from 'framer-motion';
import { GenericMatrix, GenericBarChart, GenericProcessFlow } from './templates/VisualizationTemplates';
import { StageConfig } from '../../../types/academy-schema';
import { useTranslation } from 'react-i18next';
import { getLocalizedString } from '../../../utils/tourExport';

interface DynamicStageProps {
    config: StageConfig;
    isActive: boolean;
}

export default function DynamicStage({ config }: DynamicStageProps) {
    const { i18n } = useTranslation('translation');
    const lang = (i18n.language || 'en').startsWith('es') ? 'es' : 'en';

    // Resolve all string fields that may be plain strings OR {en, es} objects
    const stageTitle    = getLocalizedString(config.title as any,    lang, '');
    const stageSubtitle = getLocalizedString(config.subtitle as any, lang, 'Stage');
    const stageContent  = config.type === 'text-concept' ? getLocalizedString((config as any).content, lang, '') : '';
    const stageCaption  = getLocalizedString((config as any).caption, lang, '');


    return (
        <div className="h-full flex flex-col items-center justify-center p-8 w-full">
            {/* Universal Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center mb-12"
            >
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800/50 border border-slate-700/50 rounded-full mb-4">
                    {/* We might need to pass role color here from parent */}
                    <span className="text-xs font-bold text-slate-300 tracking-widest uppercase">
                        {stageSubtitle}
                    </span>
                </div>
                <h3 className="text-3xl font-bold text-white mb-2">{stageTitle}</h3>
            </motion.div>

            {/* Content Renderer */}
            <div className="w-full flex justify-center items-center flex-1">
                {config.type === 'matrix-2x2' && <GenericMatrix config={config} />}
                {config.type === 'bar-chart' && <GenericBarChart config={config} />}
                {config.type === 'process-flow' && <GenericProcessFlow config={config} />}
                {config.type === 'image' && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="relative w-full max-w-4xl aspect-video rounded-2xl overflow-hidden shadow-2xl border border-slate-800 group"
                    >
                        <img
                            src={config.url}
                            alt={stageTitle}
                            className={`w-full h-full object-${config.style || 'cover'} transition-transform duration-700 group-hover:scale-105`}
                        />
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-slate-950 via-slate-900/60 to-transparent p-6 pt-12">
                            <p className="text-slate-200 text-lg font-light text-center">{stageCaption}</p>
                        </div>
                    </motion.div>
                )}
                {config.type === 'text-concept' && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 p-8 rounded-2xl max-w-3xl text-center shadow-xl shadow-cyan-900/10"
                    >
                        <div className="text-xl md:text-2xl text-slate-200 leading-relaxed font-light">
                            {stageContent}
                        </div>
                        {/* Decorative corner accent */}
                        <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-indigo-500/10 to-transparent rounded-tr-2xl -z-10" />
                        <div className="absolute bottom-0 left-0 w-16 h-16 bg-gradient-to-tr from-purple-500/10 to-transparent rounded-bl-2xl -z-10" />
                    </motion.div>
                )}
            </div>
        </div>
    );
}

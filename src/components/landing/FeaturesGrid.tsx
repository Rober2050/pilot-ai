import { motion } from 'framer-motion';
import { Brain, Search, Briefcase, Zap, Shield, TrendingUp } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const FeaturesGrid = () => {
    const { t } = useTranslation('features');

    const features = [
        {
            key: "strategy",
            icon: Brain,
            color: "text-emerald-600",
            border: "hover:border-emerald-300",
            bg: "hover:bg-emerald-50"
        },
        {
            key: "ia",
            icon: Search,
            color: "text-cyan-600",
            border: "hover:border-cyan-300",
            bg: "hover:bg-cyan-50"
        },
        {
            key: "pm",
            icon: Briefcase,
            color: "text-purple-600",
            border: "hover:border-purple-300",
            bg: "hover:bg-purple-50"
        },
        {
            key: "arch",
            icon: Shield,
            color: "text-blue-600",
            border: "hover:border-blue-300",
            bg: "hover:bg-blue-50"
        },
        {
            key: "marketing",
            icon: TrendingUp,
            color: "text-pink-600",
            border: "hover:border-pink-300",
            bg: "hover:bg-pink-50"
        },
        {
            key: "qa",
            icon: Zap,
            color: "text-amber-600",
            border: "hover:border-amber-300",
            bg: "hover:bg-amber-50"
        }
    ];

    return (
        <div className="bg-white py-24 relative overflow-hidden">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                {/* Section Header */}
                <div className="text-center mb-16 relative z-10">
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-3xl md:text-5xl font-bold text-slate-900 mb-4"
                    >
                        {t('title')}
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className="text-slate-500 max-w-2xl mx-auto text-lg"
                    >
                        {t('subtitle')}
                    </motion.p>
                </div>

                {/* Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
                    {features.map((feature, index) => (
                        <FeatureCard
                            key={index}
                            feature={feature}
                            index={index}
                            title={t(`roles.${feature.key}.title`)}
                            desc={t(`roles.${feature.key}.desc`)}
                        />
                    ))}
                </div>

                {/* Background Decor */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-500/5 rounded-full blur-[128px] pointer-events-none"></div>
            </div>
        </div>
    );
};

const FeatureCard = ({ feature, index, title, desc }: any) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.1 }}
            className={`group relative p-8 rounded-3xl bg-white border border-slate-100 shadow-sm transition-all duration-300 ${feature.border} ${feature.bg} hover:shadow-lg hover:-translate-y-1`}
        >
            <div className={`w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform ${feature.color}`}>
                <feature.icon className="w-6 h-6" />
            </div>

            <h3 className="text-xl font-bold text-slate-900 mb-3">
                {title}
            </h3>

            <p className="text-slate-500 leading-relaxed text-sm min-h-[48px]">
                {desc}
            </p>
        </motion.div>
    );
};

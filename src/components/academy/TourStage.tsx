import React from 'react';
import { motion } from 'framer-motion';
import { FeatureModule } from './AcademyData';
import {
    Sparkles,
    Target,
    Users,
    MessageSquare,
    Palette,
    FileDown,
    Shield,
    TrendingUp,
    Code
} from 'lucide-react';

// Import all stage components
import InceptionStage from './stages/InceptionStage.tsx';
import StrategyStage from './stages/StrategyStage.tsx';
import RoleFactoryStage from './stages/RoleFactoryStage.tsx';
import ChatStage from './stages/ChatStage.tsx';
import PrototypeStage from './stages/PrototypeStage.tsx';
import ExportStage from './stages/ExportStage.tsx';
import WarRoomStage from './stages/WarRoomStage.tsx';

interface TourStageProps {
    module: FeatureModule;
    isActive: boolean;
}

// Icon mapping
const iconMap: Record<string, React.ReactNode> = {
    'Sparkles': <Sparkles size={32} />,
    'Target': <Target size={32} />,
    'Users': <Users size={32} />,
    'MessageSquare': <MessageSquare size={32} />,
    'Palette': <Palette size={32} />,
    'FileDown': <FileDown size={32} />,
    'Shield': <Shield size={32} />,
    'TrendingUp': <TrendingUp size={32} />,
    'Code': <Code size={32} />
};

// Component mapping
const stageComponents: Record<string, React.ComponentType> = {
    'InceptionStage': InceptionStage,
    'StrategyStage': StrategyStage,
    'RoleFactoryStage': RoleFactoryStage,
    'ChatStage': ChatStage,
    'PrototypeStage': PrototypeStage,
    'ExportStage': ExportStage,
    'WarRoomStage': WarRoomStage
};

export default function TourStage({ module, isActive }: TourStageProps) {
    const StageComponent = stageComponents[module.demoComponent];

    if (!StageComponent) {
        return (
            <div className="flex items-center justify-center h-full text-slate-500">
                Component {module.demoComponent} not found
            </div>
        );
    }

    return (
        <motion.div
            key={module.id}
            className="w-full h-full"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
        >
            <StageComponent />
        </motion.div>
    );
}

export { iconMap };

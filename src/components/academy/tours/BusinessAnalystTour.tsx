import DynamicTour from '../engine/DynamicTour';
import { BUSINESS_ANALYST_CONFIG } from '../../../data/tours/business-analyst-config';

interface BusinessAnalystTourProps {
    onClose: () => void;
    onBack: () => void;
}

export default function BusinessAnalystTour({ onClose, onBack }: BusinessAnalystTourProps) {
    return (
        <DynamicTour
            config={BUSINESS_ANALYST_CONFIG}
            onClose={onClose}
            onBack={onBack}
        />
    );
}

import React from 'react';
import { useNavigate } from 'react-router-dom';
import AcademySelectionModal from '../components/academy/AcademySelectionModal';

export default function AcademyPage() {
    const navigate = useNavigate();
    return <AcademySelectionModal isOpen={true} onClose={() => navigate('/')} />;
}

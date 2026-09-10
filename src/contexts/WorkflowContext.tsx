import React, { createContext, useContext, useState, ReactNode } from 'react';

interface WorkflowContextType {
    autoFlow: boolean;
    setAutoFlow: (value: boolean) => void;
    refreshTrigger: number;
    refreshProjects: () => void;
    currentProjectName: string | null;
    setCurrentProjectName: (name: string | null) => void;
}

const WorkflowContext = createContext<WorkflowContextType | undefined>(undefined);

export const WorkflowProvider = ({ children }: { children: ReactNode }) => {
    const [autoFlow, setAutoFlow] = useState(false);
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [currentProjectName, setCurrentProjectName] = useState<string | null>(null);

    const refreshProjects = () => {
        setRefreshTrigger(prev => prev + 1);
    };

    return (
        <WorkflowContext.Provider value={{ autoFlow, setAutoFlow, refreshTrigger, refreshProjects, currentProjectName, setCurrentProjectName }}>
            {children}
        </WorkflowContext.Provider>
    );
};

export const useWorkflow = () => {
    const context = useContext(WorkflowContext);
    if (context === undefined) {
        throw new Error('useWorkflow must be used within a WorkflowProvider');
    }
    return context;
};

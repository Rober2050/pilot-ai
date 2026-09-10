// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { UniversalRoleDashboard } from '../components/dashboard/UniversalRoleDashboard';
import { UniversalDashboardSchema } from '../types/universalDashboard';


// Mock dependencies that might cause issues in test environment
vi.mock('../components/SmartDiagram', () => ({
    SmartDiagram: () => <div data-testid="smart-diagram">Smart Diagram Mock</div>
}));

vi.mock('react-markdown', () => ({
    default: ({ children }: { children: any }) => <div>{children}</div>
}));
vi.mock('../components/dashboard/SchemaVisualizer', () => ({
    SchemaVisualizer: () => <div data-testid="schema-visualizer">Schema Visualizer Mock</div>
}));
vi.mock('lucide-react', () => {
    return {
        Zap: () => <div data-testid="icon-zap" />,
        DollarSign: () => <div data-testid="icon-dollar" />,
        CheckCircle: () => <div data-testid="icon-check" />,
        AlertTriangle: () => <div />,
        Clock: () => <div />,
        Database: () => <div data-testid="icon-db" />,
        Server: () => <div data-testid="icon-server" />,
        Layout: () => <div />,
        Shield: () => <div />,
        Globe: () => <div />,
        Cpu: () => <div />,
        TrendingUp: () => <div />,
        TrendingDown: () => <div />,
        Minus: () => <div />,
        Info: () => <div />,
        Hash: () => <div />,
        AlignLeft: () => <div />,
        Calendar: () => <div />,
        Type: () => <div />,
        Key: () => <div />,
        Table: () => <div />,
        BookOpen: () => <div />,
        X: () => <div />
    };
});

describe('UniversalRoleDashboard', () => {
    const mockData: UniversalDashboardSchema = {
        summary: "This is a test summary for the dashboard.",
        kpis: [
            { label: "Test KPI 1", value: "100%", icon: "Zap", color: "emerald" },
            { label: "Test KPI 2", value: "50", icon: "DollarSign", color: "blue" }
        ],
        tabs: [
            {
                id: "tab-1",
                label: "Tech Stack",
                type: "tech-stack",
                icon: "Server",
                data: [
                    { category: "Frontend", items: [{ name: "React" }] }
                ]
            },
            {
                id: "tab-2",
                label: "Schema",
                type: "schema-visualizer",
                icon: "Database",
                data: {
                    tables: [
                        { name: "Users", columns: [{ name: "id", type: "int" }] }
                    ]
                }
            }
        ]
    };

    it('renders the executive summary', () => {
        render(<UniversalRoleDashboard data={mockData} />);
        expect(screen.getByText("Executive Summary")).toBeDefined();
        expect(screen.getByText("This is a test summary for the dashboard.")).toBeDefined();
    });

    it('renders KPIs correctly', () => {
        render(<UniversalRoleDashboard data={mockData} />);
        expect(screen.getByText("Test KPI 1")).toBeDefined();
        expect(screen.getByText("100%")).toBeDefined();
        expect(screen.getByText("Test KPI 2")).toBeDefined();
        expect(screen.getByText("50")).toBeDefined();
    });

    it('renders tabs and switches content', () => {
        render(<UniversalRoleDashboard data={mockData} />);

        // Check initial tab (Tech Stack)
        expect(screen.getByText("Tech Stack")).toBeDefined();
        expect(screen.getByText("Frontend")).toBeDefined(); // Content of first tab

        // Switch to Schema tab
        const schemaTab = screen.getByText("Schema");
        fireEvent.click(schemaTab);

        // Check if Schema content is rendered
        expect(screen.getByText("Users")).toBeDefined(); // Table name in schema
    });

    it('handles missing data gracefully', () => {
        const { container } = render(<UniversalRoleDashboard data={null as any} />);
        expect(container.firstChild).toBeNull();
    });
});

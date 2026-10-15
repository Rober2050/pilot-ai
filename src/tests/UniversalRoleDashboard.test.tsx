// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
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
vi.mock('lucide-react', async (importOriginal) => {
    // Keep every real icon (the dashboard imports many); override only the ones asserted on.
    const actual = await importOriginal<typeof import('lucide-react')>();
    return {
        ...actual,
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

// vitest runs without globals, so Testing Library cannot register its automatic cleanup.
afterEach(cleanup);

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
        // The heading comes from i18n (businessAnalyst:executiveSummary); without a loaded
        // locale the test renderer shows the key itself.
        expect(screen.getByText(/executiveSummary|Executive Summary/)).toBeDefined();
        expect(screen.getByText("This is a test summary for the dashboard.")).toBeDefined();
    });

    it('renders KPIs correctly', () => {
        render(<UniversalRoleDashboard data={mockData} />);
        // KPI labels render in the card and in its tooltip.
        expect(screen.getAllByText("Test KPI 1").length).toBeGreaterThan(0);
        expect(screen.getAllByText("100%").length).toBeGreaterThan(0);
        expect(screen.getAllByText("Test KPI 2").length).toBeGreaterThan(0);
        expect(screen.getAllByText("50").length).toBeGreaterThan(0);
    });

    it('renders tabs and switches content', () => {
        render(<UniversalRoleDashboard data={mockData} />);

        // Check initial tab (Tech Stack)
        // The active tab's label shows in the tab strip and as its content heading.
        expect(screen.getAllByText("Tech Stack").length).toBeGreaterThan(0);
        expect(screen.getAllByText("Frontend").length).toBeGreaterThan(0); // Content of first tab

        // Switch to Schema tab
        // Tab labels go through i18n (businessAnalyst:tab.<id>); without a locale the key shows.
        const schemaTab = screen.getByRole('button', { name: /^\s*(Schema|tab\.tab-2)\s*$/ });
        fireEvent.click(schemaTab);

        // Schema content is rendered (SchemaVisualizer is mocked at the top of this file)
        expect(screen.getByText("Schema Visualizer Mock")).toBeDefined();
    });

    it('handles missing data gracefully', () => {
        const { container } = render(<UniversalRoleDashboard data={null as any} />);
        expect(container.firstChild).toBeNull();
    });
});

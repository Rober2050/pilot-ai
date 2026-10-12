import { describe, it, expect } from 'vitest';
import { buildPreviousRolesContext } from './compactRoleContext';

const bigRole = (name: string) => ({
    role: name,
    output: {
        summary: 'x'.repeat(5_000),
        items: Array.from({ length: 200 }, (_, i) => ({ id: i, text: 'y'.repeat(400) })),
        prototypeHtml: '<html>' + 'z'.repeat(50_000) + '</html>',
    },
});

describe('buildPreviousRolesContext', () => {
    it('returns the full JSON when it fits', () => {
        const entries = [{ role: 'PM', output: { a: 1 } }];
        expect(buildPreviousRolesContext(entries)).toBe(JSON.stringify(entries));
    });

    it('keeps six large roles under the budget and still parseable', () => {
        const entries = ['SA', 'PM', 'BA', 'ProjM', 'MKT', 'ARCH'].map(bigRole);
        expect(JSON.stringify(entries).length).toBeGreaterThan(400_000);
        const out = buildPreviousRolesContext(entries);
        expect(out.length).toBeLessThanOrEqual(180_000);
        const parsed = JSON.parse(out);
        expect(parsed).toHaveLength(6);
        expect(parsed[0].output.prototypeHtml).toBe('[artifact omitted]');
    });

    it('falls back to a per-role share when even strict passes overflow', () => {
        const entries = Array.from({ length: 9 }, (_, i) => bigRole(`R${i}`));
        const out = buildPreviousRolesContext(entries, 5_000);
        expect(out.length).toBeLessThanOrEqual(5_000);
        expect(JSON.parse(out)).toHaveLength(9);
    });
});

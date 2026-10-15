import { describe, it, expect } from 'vitest';
import { applyDeepPatch, ROLE_TIMEOUTS_MS, DEFAULT_TIMEOUT_MS } from './roleExecution';

describe('applyDeepPatch', () => {
    it('updates a key nested anywhere in the content tree', () => {
        const content = { dashboard: { productDetails: { mvpInScope: ['a'], vision: 'v' } } };
        const result = applyDeepPatch(content, { mvpInScope: ['b', 'c'] });
        expect(result).toEqual({ dashboard: { productDetails: { mvpInScope: ['b', 'c'], vision: 'v' } } });
    });

    it('adds the key at the top level when it does not exist', () => {
        const result = applyDeepPatch({ summary: 's' }, { risks: ['r1'] });
        expect(result).toEqual({ summary: 's', risks: ['r1'] });
    });

    it('does not mutate the original content', () => {
        const content = { a: { b: 1 } };
        applyDeepPatch(content, { b: 2 });
        expect(content).toEqual({ a: { b: 1 } });
    });
});

describe('role timeouts', () => {
    it('gives heavy roles more time than the default', () => {
        expect(ROLE_TIMEOUTS_MS['architect']).toBeGreaterThan(DEFAULT_TIMEOUT_MS);
        expect(ROLE_TIMEOUTS_MS['ux-designer']).toBeGreaterThan(DEFAULT_TIMEOUT_MS);
    });
});

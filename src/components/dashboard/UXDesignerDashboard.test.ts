import { describe, it, expect } from 'vitest';
import { formatUiType } from './UXDesignerDashboard';

const t = (key: string) => `T(${key})`;

describe('formatUiType', () => {
    it('maps the protocol letter to its translated name', () => {
        expect(formatUiType('C', t)).toBe('T(uxBrief.uiTypes.C)');
        expect(formatUiType(' a ', t)).toBe('T(uxBrief.uiTypes.A)');
        expect(formatUiType('B - Admin dashboard', t)).toBe('T(uxBrief.uiTypes.B)');
    });

    it('keeps free text that is not a protocol letter', () => {
        expect(formatUiType('Landing page', t)).toBe('Landing page');
        expect(formatUiType('F', t)).toBe('F');
    });
});

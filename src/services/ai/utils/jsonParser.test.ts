import { describe, it, expect } from 'vitest';
import { extractJSONFromText } from './jsonParser';

describe('extractJSONFromText', () => {
    it('keeps the whole JSON when a code fence appears inside a string value', () => {
        const obj = { dashboard: { iac: 'Ejemplo:\n```bash\nterraform apply\n```\nlisto', ok: true } };
        expect(JSON.parse(extractJSONFromText(JSON.stringify(obj)))).toEqual(obj);
    });

    it('still unwraps JSON fenced as a whole', () => {
        const text = 'Here it is:\n```json\n{"a": 1}\n```\nthanks';
        expect(JSON.parse(extractJSONFromText(text))).toEqual({ a: 1 });
    });

    it('strips prose around unfenced JSON', () => {
        expect(JSON.parse(extractJSONFromText('Result: {"a": [1, 2]} done'))).toEqual({ a: [1, 2] });
    });
});

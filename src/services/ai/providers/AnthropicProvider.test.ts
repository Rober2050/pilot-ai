import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../firebase/firebaseClient', () => ({
    supabase: { auth: { getSession: async () => ({ data: { session: { access_token: 't' } } }) } },
    SUPABASE_URL: 'https://example.supabase.co',
}));
vi.mock('../../firebase/loggingService', () => ({
    loggingService: { logError: vi.fn(async () => undefined) },
}));

import { AnthropicProvider } from './AnthropicProvider';

/** Builds an SSE body from text deltas; omits message_stop to simulate a cut stream. */
function sse(deltas: string[], complete: boolean): Response {
    const events = [
        { type: 'message_start', message: { usage: { input_tokens: 10, output_tokens: 1 } } },
        { type: 'content_block_start', index: 0, content_block: { type: 'text' } },
        ...deltas.map(text => ({ type: 'content_block_delta', index: 0, delta: { type: 'text_delta', text } })),
        ...(complete
            ? [{ type: 'message_delta', delta: { stop_reason: 'end_turn' }, usage: { output_tokens: 20 } }, { type: 'message_stop' }]
            : []),
    ];
    const body = events.map(e => `event: ${e.type}\ndata: ${JSON.stringify(e)}\n\n`).join('');
    return new Response(body, { status: 200, headers: { 'content-type': 'text/event-stream' } });
}

describe('AnthropicProvider stream continuation', () => {
    const fetchMock = vi.fn();
    beforeEach(() => {
        fetchMock.mockReset();
        vi.stubGlobal('fetch', fetchMock);
    });

    it('resumes a cut stream from the partial output and joins the JSON', async () => {
        fetchMock
            .mockResolvedValueOnce(sse(['"title": "Arqui', 'tectura", "items": [1, '], false))
            .mockResolvedValueOnce(sse(['2, 3], "done": true}'], true));

        const result = await new AnthropicProvider().generateJSON<any>('claude-haiku-4-5-20251001', 'sys', 'user');

        expect(result).toEqual({ title: 'Arquitectura', items: [1, 2, 3], done: true });
        expect(fetchMock).toHaveBeenCalledTimes(2);
        const second = JSON.parse(fetchMock.mock.calls[1][1].body);
        const prefill = second.messages[second.messages.length - 1];
        expect(prefill.role).toBe('assistant');
        expect(prefill.content).toBe('{"title": "Arquitectura", "items": [1,');
    });

    it('does not continue a complete stream', async () => {
        fetchMock.mockResolvedValueOnce(sse(['"ok": true}'], true));
        const result = await new AnthropicProvider().generateJSON<any>('claude-haiku-4-5-20251001', 'sys', 'user');
        expect(result).toEqual({ ok: true });
        expect(fetchMock).toHaveBeenCalledTimes(1);
    });
});

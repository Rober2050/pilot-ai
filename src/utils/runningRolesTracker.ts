/**
 * Running Roles Tracker
 *
 * Persists "currently executing role" state across page reloads via sessionStorage.
 *
 * WHY THIS EXISTS
 * Before this module, in-flight role analyses were tracked only in a React useRef.
 * The ref vanished on every reload, so the stale-cleanup logic in StrategyHub
 * incorrectly flagged still-running analyses as "interrupted" — even when the
 * Edge Function was happily generating a response.
 *
 * SCOPE
 * Per-project, per-tab. We use sessionStorage (not localStorage) so two tabs of
 * the same project don't fight over each other's analyses, and entries die with
 * the tab.
 *
 * TTL
 * Each entry expires after MAX_ANALYSIS_DURATION_MS. Expired entries are treated
 * as not-tracked, which lets the stale-cleanup code do its job for genuinely
 * abandoned analyses (e.g. user closed the tab mid-run, then reopened it
 * 10 minutes later).
 */

const STORAGE_KEY_PREFIX = 'pilot_running_roles__';

/**
 * Maximum time a role analysis can legitimately take before we treat it as
 * abandoned. Aligned with the longest per-role timeout in StrategyHub
 * (currently 4 min) plus 1 min margin for slow networks / retries.
 */
export const MAX_ANALYSIS_DURATION_MS = 5 * 60 * 1000;

type Entry = { roleId: string; startedAt: number };

function storageKey(projectId: string): string {
    return `${STORAGE_KEY_PREFIX}${projectId}`;
}

function readAll(projectId: string): Entry[] {
    if (!projectId) return [];
    try {
        const raw = sessionStorage.getItem(storageKey(projectId));
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) return [];
        const now = Date.now();
        return parsed.filter(
            (e: Entry) => e?.roleId && e?.startedAt && now - e.startedAt < MAX_ANALYSIS_DURATION_MS,
        );
    } catch {
        return [];
    }
}

function writeAll(projectId: string, entries: Entry[]): void {
    if (!projectId) return;
    try {
        sessionStorage.setItem(storageKey(projectId), JSON.stringify(entries));
    } catch {
        // sessionStorage can fail (private mode quota, disabled). Best-effort.
    }
}

/** Mark a role as currently running for the given project. */
export function trackRoleStart(projectId: string, roleId: string): void {
    const entries = readAll(projectId).filter(e => e.roleId !== roleId);
    entries.push({ roleId, startedAt: Date.now() });
    writeAll(projectId, entries);
}

/** Clear a role from the running set (on success, error, or cancellation). */
export function trackRoleEnd(projectId: string, roleId: string): void {
    const entries = readAll(projectId).filter(e => e.roleId !== roleId);
    writeAll(projectId, entries);
}

/**
 * Returns true if the role is currently being executed in this tab AND has
 * been running for less than MAX_ANALYSIS_DURATION_MS.
 *
 * Use this in stale-cleanup logic to distinguish "in-flight from this tab"
 * from "abandoned by some previous session".
 */
export function isRoleRunning(projectId: string, roleId: string): boolean {
    return readAll(projectId).some(e => e.roleId === roleId);
}

/** Clear all tracked roles for a project (e.g. when switching projects). */
export function clearProjectTracking(projectId: string): void {
    if (!projectId) return;
    try {
        sessionStorage.removeItem(storageKey(projectId));
    } catch {
        // Best-effort.
    }
}

import { loggingService } from '../firebase/loggingService';

/**
 * Premium Notification Service for PILOT AI
 * Creates elegant, non-blocking UI notifications inspired by Google Gemini and C-Level dashboards.
 * Avoids browser alerts and provides a modern "Glassmorphism" look.
 */

type NotificationType = 'success' | 'error' | 'warning' | 'info';

export const notificationService = {
    /**
     * Shows a premium toast notification
     */
    notify: (message: string, type: NotificationType = 'info', duration: number = 5000) => {
        // Remove existing notifications to avoid stacking mess
        const existing = document.querySelectorAll('.pilot-ai-notification');
        existing.forEach(el => el.remove());

        const toast = document.createElement('div');
        toast.className = `pilot-ai-notification fixed top-6 left-1/2 transform -translate-x-1/2 z-[9999] 
                            flex items-center gap-4 px-6 py-4 rounded-2xl shadow-2xl border backdrop-blur-xl
                            animate-in slide-in-from-top-4 duration-300 transition-all`;
        
        // Dynamic styling based on type
        const styles = {
            success: 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400',
            error:   'bg-red-500/10 border-red-500/50 text-red-400',
            warning: 'bg-amber-500/10 border-amber-500/50 text-amber-400',
            info:    'bg-indigo-500/10 border-indigo-500/50 text-indigo-400'
        };

        const icons = {
            success: 'check-circle',
            error:   'x-circle',
            warning: 'alert-triangle',
            info:    'info'
        };

        toast.className += ` ${styles[type]}`;

        // Create inner content with SVG icon simulating Lucide
        toast.innerHTML = `
            <div class="flex items-center gap-3">
                <div class="p-2 rounded-full bg-current opacity-20"></div>
                <div class="flex flex-col">
                    <span class="text-sm font-bold tracking-tight">${type.toUpperCase()}</span>
                    <p class="text-[13px] opacity-90 leading-tight">${message}</p>
                </div>
            </div>
            <button class="ml-4 opacity-50 hover:opacity-100 transition-opacity" onclick="this.parentElement.remove()">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
        `;

        document.body.appendChild(toast);

        // Auto-remove
        setTimeout(() => {
            if (toast.parentElement) {
                toast.classList.add('opacity-0', '-translate-y-2');
                setTimeout(() => toast.remove(), 300);
            }
        }, duration);
    },

    showError: (message: string, source: string, error?: any) => {
        console.error(`[${source}]`, error);
        notificationService.notify(message, 'error');
        // Also log to diagnostic center
        loggingService.logError(source, message, { error: error?.message || error });
    },

    showSuccess: (message: string) => {
        notificationService.notify(message, 'success');
    }
};

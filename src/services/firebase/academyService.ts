/**
 * Academy Service — STUB temporal post-migración.
 *
 * La tabla `academy_content` aún no existe en el schema Supabase. Como el seed
 * original de Firestore tampoco insertaba contenido (INITIAL_CONTENT = []), el
 * servicio devolvía siempre arrays vacíos. Esta versión replica ese comportamiento
 * sin tocar BD para evitar errores en runtime.
 *
 * Para activar Academy en el futuro:
 *  1. Agregar tabla `academy_content` al schema (similar a ai_roles)
 *  2. Actualizar este servicio para hacer queries reales
 */

import { AcademyContent } from '../../types/academy';
import { loggingService } from './loggingService';

const NOT_IMPLEMENTED_MSG = '[Academy] Servicio no migrado aún a Supabase — devolviendo datos vacíos';

export const academyService = {
    getAllContent: async (): Promise<AcademyContent[]> => {
        return [];
    },

    getContentById: async (_contentId: string): Promise<AcademyContent | null> => {
        return null;
    },

    saveContent: async (
        content: Omit<AcademyContent, 'createdAt' | 'updatedAt'>,
        userId: string,
    ): Promise<void> => {
        await loggingService.logInfo(
            'academy',
            NOT_IMPLEMENTED_MSG,
            { contentId: content.contentId, userId },
        );
    },

    deleteContent: async (contentId: string): Promise<void> => {
        await loggingService.logInfo('academy', NOT_IMPLEMENTED_MSG, { contentId });
    },

    initializeDefaultContent: async (): Promise<void> => {
        // No-op
    },
};

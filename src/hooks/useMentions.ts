/**
 * ✅ BATCH 4.5: @Mentions Utility Hook
 * 
 * Detects @ trigger in textarea and provides mention suggestions
 */

import { useState, useEffect } from 'react';
import { RoleConfig } from '../types/roles';

export interface MentionState {
    show: boolean;
    filter: string;
    selectedIndex: number;
    filteredRoles: RoleConfig[];
}

export function useMentions(
    text: string,
    cursorPosition: number,
    activeRoles: RoleConfig[]
) {
    const [mentionState, setMentionState] = useState<MentionState>({
        show: false,
        filter: '',
        selectedIndex: 0,
        filteredRoles: []
    });

    useEffect(() => {
        const textBeforeCursor = text.substring(0, cursorPosition);
        const lastAtIndex = textBeforeCursor.lastIndexOf('@');

        if (lastAtIndex !== -1) {
            const textAfterAt = textBeforeCursor.substring(lastAtIndex + 1);

            // Check if there's no space after @
            if (!textAfterAt.includes(' ')) {
                const filtered = activeRoles.filter(role =>
                    role.displayName.toLowerCase().includes(textAfterAt.toLowerCase())
                );

                setMentionState({
                    show: filtered.length > 0,
                    filter: textAfterAt,
                    selectedIndex: 0,
                    filteredRoles: filtered
                });
                return;
            }
        }

        setMentionState(prev => ({ ...prev, show: false }));
    }, [text, cursorPosition, activeRoles]);

    const selectMention = (index: number) => {
        setMentionState(prev => ({
            ...prev,
            selectedIndex: Math.max(0, Math.min(index, prev.filteredRoles.length - 1))
        }));
    };

    const closeMentions = () => {
        setMentionState(prev => ({ ...prev, show: false }));
    };

    return {
        ...mentionState,
        selectMention,
        closeMentions
    };
}

/**
 * Inserts a mention into text at the cursor position
 */
export function insertMention(
    text: string,
    cursorPosition: number,
    roleName: string
): { newText: string; newCursorPosition: number } {
    const textBeforeCursor = text.substring(0, cursorPosition);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');

    if (lastAtIndex !== -1) {
        const before = text.substring(0, lastAtIndex);
        const after = text.substring(cursorPosition);
        const newText = `${before}@${roleName} ${after}`;
        const newCursorPosition = lastAtIndex + roleName.length + 2;

        return { newText, newCursorPosition };
    }

    return { newText: text, newCursorPosition: cursorPosition };
}

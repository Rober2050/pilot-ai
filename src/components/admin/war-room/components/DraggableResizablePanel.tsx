import React, { useState, useRef, useEffect } from 'react';
import { Maximize2, Move } from 'lucide-react';

interface DraggableResizablePanelProps {
    children: React.ReactNode;
    initialWidth?: number;
    initialHeight?: number;
    initialX?: number;
    initialY?: number;
    minWidth?: number;
    minHeight?: number;
    title?: string;
    className?: string;
}

export const DraggableResizablePanel: React.FC<DraggableResizablePanelProps> = ({
    children,
    initialWidth = 320,
    initialHeight = 400,
    initialX = 100,
    initialY = 100,
    minWidth = 200,
    minHeight = 150,
    title = "Panel",
    className = ""
}) => {
    const [position, setPosition] = useState({ x: initialX, y: initialY });
    const [size, setSize] = useState({ width: initialWidth, height: initialHeight });
    const [isDragging, setIsDragging] = useState(false);
    const [isResizing, setIsResizing] = useState(false);

    // Refs for drag/resize interaction
    const panelRef = useRef<HTMLDivElement>(null);
    const dragStartRef = useRef<{ x: number, y: number }>({ x: 0, y: 0 });
    const initialPosRef = useRef<{ x: number, y: number }>({ x: 0, y: 0 });
    const initialSizeRef = useRef<{ w: number, h: number }>({ w: 0, h: 0 });

    // Handle Dragging
    const handleMouseDownDrag = (e: React.MouseEvent) => {
        // Only trigger if clicking the header/handle
        e.stopPropagation();
        setIsDragging(true);
        dragStartRef.current = { x: e.clientX, y: e.clientY };
        initialPosRef.current = { ...position };
    };

    // Handle Resizing
    const handleMouseDownResize = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsResizing(true);
        dragStartRef.current = { x: e.clientX, y: e.clientY };
        initialSizeRef.current = { w: size.width, h: size.height };
    };

    // Global Mouse Move/Up listeners
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (isDragging) {
                const deltaX = e.clientX - dragStartRef.current.x;
                const deltaY = e.clientY - dragStartRef.current.y;
                setPosition({
                    x: initialPosRef.current.x + deltaX,
                    y: initialPosRef.current.y + deltaY
                });
            } else if (isResizing) {
                const deltaX = e.clientX - dragStartRef.current.x;
                const deltaY = e.clientY - dragStartRef.current.y;
                setSize({
                    width: Math.max(minWidth, initialSizeRef.current.w + deltaX),
                    height: Math.max(minHeight, initialSizeRef.current.h + deltaY)
                });
            }
        };

        const handleMouseUp = () => {
            setIsDragging(false);
            setIsResizing(false);
        };

        if (isDragging || isResizing) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
        }

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, isResizing, minWidth, minHeight]);

    return (
        <div
            ref={panelRef}
            className={`fixed z-[90] flex flex-col shadow-2xl backdrop-blur-xl bg-slate-900/80 border border-white/10 rounded-xl overflow-hidden transition-shadow duration-200 ${isDragging ? 'cursor-grabbing shadow-cyan-500/20' : ''} ${className}`}
            style={{
                left: `${position.x}px`,
                top: `${position.y}px`,
                width: `${size.width}px`,
                height: `${size.height}px`,
            }}
        >
            {/* Header / Drag Handle */}
            <div
                onMouseDown={handleMouseDownDrag}
                className="h-8 bg-black/40 border-b border-white/10 flex items-center justify-between px-3 cursor-grab active:cursor-grabbing select-none group"
            >
                <div className="flex items-center gap-2 text-[10px] font-bold text-cyan-400 uppercase tracking-widest">
                    <Move className="w-3 h-3 opacity-50 group-hover:opacity-100 transition-opacity" />
                    {title}
                </div>
                <div className="flex gap-1">
                    <div className="w-10 h-1 rounded-full bg-white/10 group-hover:bg-cyan-500/30 transition-colors"></div>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-hidden relative">
                {children}

                {/* Resize Handle (Bottom Right) */}
                <div
                    onMouseDown={handleMouseDownResize}
                    className="absolute bottom-0 right-0 w-6 h-6 z-20 cursor-nwse-resize flex items-center justify-center text-white/20 hover:text-cyan-400 transition-colors"
                >
                    <Maximize2 className="w-3 h-3 rotate-90" />
                </div>
            </div>
        </div>
    );
};

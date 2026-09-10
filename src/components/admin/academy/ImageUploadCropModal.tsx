import { useState, useRef, useEffect } from 'react';
import { X, Upload, Check } from 'lucide-react';

interface ImageUploadCropModalProps {
    isOpen: boolean;
    onClose: () => void;
    onImageCropped: (base64Image: string) => void;
    roleName: string;
}

export default function ImageUploadCropModal({ isOpen, onClose, onImageCropped, roleName }: ImageUploadCropModalProps) {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [imageSrc, setImageSrc] = useState<string>('');
    const [crop, setCrop] = useState({ x: 0, y: 0, width: 200, height: 200 });
    const [isDragging, setIsDragging] = useState(false);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const imageRef = useRef<HTMLImageElement>(null);

    useEffect(() => {
        if (!selectedFile) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            setImageSrc(e.target?.result as string);
        };
        reader.readAsDataURL(selectedFile);
    }, [selectedFile]);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type (only JPG/WebP)
        const validTypes = ['image/jpeg', 'image/jpg', 'image/webp'];
        if (!validTypes.includes(file.type)) {
            alert('⚠️ Only JPG and WebP images are supported.\nPlease convert your image to JPG format.');
            return;
        }

        // Validate file size (max 200KB)
        const maxSize = 200 * 1024; // 200KB in bytes
        if (file.size > maxSize) {
            const fileSizeKB = Math.round(file.size / 1024);
            alert(`⚠️ Image is too large (${fileSizeKB}KB).\n\nMaximum size: 200KB\n\nPlease compress your image using:\n• TinyJPG.com\n• Squoosh.app\n• Compressor.io`);
            return;
        }

        setSelectedFile(file);
    };

    const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
        setIsDragging(true);
        const rect = e.currentTarget.getBoundingClientRect();
        setCrop({
            ...crop,
            x: e.clientX - rect.left - crop.width / 2,
            y: e.clientY - rect.top - crop.height / 2
        });
    };

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!isDragging) return;
        const rect = e.currentTarget.getBoundingClientRect();
        setCrop({
            ...crop,
            x: Math.max(0, Math.min(e.clientX - rect.left - crop.width / 2, rect.width - crop.width)),
            y: Math.max(0, Math.min(e.clientY - rect.top - crop.height / 2, rect.height - crop.height))
        });
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    const handleCropAndSave = () => {
        if (!imageRef.current || !canvasRef.current) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Set canvas size to crop size
        canvas.width = crop.width;
        canvas.height = crop.height;

        // Calculate scale factor
        const img = imageRef.current;
        const scaleX = img.naturalWidth / img.width;
        const scaleY = img.naturalHeight / img.height;

        // Draw cropped image
        ctx.drawImage(
            img,
            crop.x * scaleX,
            crop.y * scaleY,
            crop.width * scaleX,
            crop.height * scaleY,
            0,
            0,
            crop.width,
            crop.height
        );

        // Convert to Base64
        const base64 = canvas.toDataURL('image/png');
        onImageCropped(base64);
        handleClose();
    };

    const handleClose = () => {
        setSelectedFile(null);
        setImageSrc('');
        setCrop({ x: 0, y: 0, width: 200, height: 200 });
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 rounded-xl border border-slate-700 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-700">
                    <div>
                        <h2 className="text-xl font-bold text-white">Upload Image for {roleName}</h2>
                        <p className="text-sm text-slate-400 mt-1">Select an image and adjust the crop area</p>
                    </div>
                    <button
                        onClick={handleClose}
                        className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
                    >
                        <X size={20} className="text-slate-400" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* File Upload */}
                    {!imageSrc && (
                        <div className="border-2 border-dashed border-slate-700 rounded-lg p-12 text-center">
                            <Upload size={48} className="mx-auto text-slate-500 mb-4" />
                            <p className="text-slate-300 mb-2">Click to upload or drag and drop</p>
                            <p className="text-xs text-slate-500 mb-4">JPG or WebP only • Max 200KB</p>
                            <input
                                type="file"
                                accept="image/jpeg,image/jpg,image/webp"
                                onChange={handleFileSelect}
                                className="hidden"
                                id="image-upload"
                            />
                            <label
                                htmlFor="image-upload"
                                className="inline-block px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg cursor-pointer transition-colors"
                            >
                                Choose Image
                            </label>
                        </div>
                    )}

                    {/* Image Crop Area */}
                    {imageSrc && (
                        <div className="space-y-4">
                            <div
                                className="relative inline-block max-w-full overflow-hidden rounded-lg border border-slate-700"
                                onMouseDown={handleMouseDown}
                                onMouseMove={handleMouseMove}
                                onMouseUp={handleMouseUp}
                                onMouseLeave={handleMouseUp}
                            >
                                <img
                                    ref={imageRef}
                                    src={imageSrc}
                                    alt="Upload preview"
                                    className="max-w-full h-auto"
                                    style={{ maxHeight: '500px' }}
                                />
                                {/* Crop Overlay */}
                                <div
                                    className="absolute border-2 border-indigo-500 bg-indigo-500/10 cursor-move"
                                    style={{
                                        left: `${crop.x}px`,
                                        top: `${crop.y}px`,
                                        width: `${crop.width}px`,
                                        height: `${crop.height}px`
                                    }}
                                >
                                    <div className="absolute inset-0 grid grid-cols-3 grid-rows-3">
                                        {[...Array(9)].map((_, i) => (
                                            <div key={i} className="border border-indigo-500/30" />
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <p className="text-sm text-slate-400">
                                💡 Click and drag to position the crop area
                            </p>

                            {/* Crop Size Controls */}
                            <div className="space-y-4">
                                <div className="flex gap-4">
                                    <div className="flex-1">
                                        <label className="block text-sm text-slate-400 mb-2">Width</label>
                                        <input
                                            type="range"
                                            min="100"
                                            max="800"
                                            value={crop.width}
                                            onChange={(e) => setCrop({ ...crop, width: parseInt(e.target.value) })}
                                            className="w-full"
                                        />
                                        <span className="text-xs text-slate-500">{crop.width}px</span>
                                    </div>
                                    <div className="flex-1">
                                        <label className="block text-sm text-slate-400 mb-2">Height</label>
                                        <input
                                            type="range"
                                            min="100"
                                            max="800"
                                            value={crop.height}
                                            onChange={(e) => setCrop({ ...crop, height: parseInt(e.target.value) })}
                                            className="w-full"
                                        />
                                        <span className="text-xs text-slate-500">{crop.height}px</span>
                                    </div>
                                </div>

                                <button
                                    onClick={() => {
                                        if (imageRef.current) {
                                            const img = imageRef.current;
                                            // Use full image without cropping
                                            const canvas = canvasRef.current;
                                            if (!canvas) return;

                                            canvas.width = img.naturalWidth;
                                            canvas.height = img.naturalHeight;
                                            const ctx = canvas.getContext('2d');
                                            if (!ctx) return;

                                            ctx.drawImage(img, 0, 0);
                                            const base64 = canvas.toDataURL('image/png');
                                            onImageCropped(base64);
                                            handleClose();
                                        }
                                    }}
                                    className="w-full px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors text-sm"
                                >
                                    ✨ Use Full Image (No Crop)
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-700">
                    <button
                        onClick={handleClose}
                        className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
                    >
                        Cancel
                    </button>
                    {imageSrc && (
                        <button
                            onClick={handleCropAndSave}
                            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors flex items-center gap-2"
                        >
                            <Check size={18} />
                            Add to Tour
                        </button>
                    )}
                </div>
            </div>

            {/* Hidden canvas for cropping */}
            <canvas ref={canvasRef} className="hidden" />
        </div>
    );
}

import { useState, useCallback } from 'react';
import Cropper, { type Area } from 'react-easy-crop';
import { X, Loader2, RotateCw } from 'lucide-react';

interface ImageCropperProps {
    imageSrc: string;
    onCropDone: (file: File) => void;
    onCancel: () => void;
    cropShape?: 'round' | 'rect';
}

export default function ImageCropper({
    imageSrc,
    onCropDone,
    onCancel,
    cropShape = 'round',
}: ImageCropperProps) {
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [rotation, setRotation] = useState(0);
    const [isProcessing, setIsProcessing] = useState(false);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

    const onCropComplete = useCallback(
        (_: any, croppedPixels: Area) => {
            setCroppedAreaPixels(croppedPixels);
        },
        [],
    );

    const getCroppedImg = async () => {
        if (!croppedAreaPixels) return;
        setIsProcessing(true);

        const image = new Image();
        image.src = imageSrc;

        await new Promise((resolve) => {
            image.onload = resolve;
        });

        const size = cropShape === 'round'
            ? Math.max(croppedAreaPixels.width, croppedAreaPixels.height)
            : croppedAreaPixels.width;
        const canvasSize = cropShape === 'round' ? size : croppedAreaPixels.width;
        const canvasHeight = cropShape === 'round' ? size : croppedAreaPixels.height;

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        canvas.width = canvasSize;
        canvas.height = canvasHeight;

        if (ctx) {
            ctx.save();

            if (cropShape === 'round') {
                ctx.beginPath();
                ctx.arc(canvasSize / 2, canvasSize / 2, canvasSize / 2, 0, Math.PI * 2);
                ctx.clip();
            }

            ctx.translate(canvasSize / 2, canvasHeight / 2);
            ctx.rotate((rotation * Math.PI) / 180);
            ctx.translate(-canvasSize / 2, -canvasHeight / 2);
            ctx.drawImage(
                image,
                croppedAreaPixels.x,
                croppedAreaPixels.y,
                croppedAreaPixels.width,
                croppedAreaPixels.height,
                0,
                0,
                canvasSize,
                canvasHeight,
            );
            ctx.restore();
        }

        canvas.toBlob(
            (blob) => {
                if (blob) {
                    const file = new File([blob], 'cropped-image.jpg', {
                        type: 'image/jpeg',
                    });
                    onCropDone(file);
                }
                setIsProcessing(false);
            },
            'image/jpeg',
            0.9,
        );
    };

    return (
        <div className="fixed inset-0 bg-primaryBlack/80 z-50 flex items-center justify-center p-4">
            <div className="bg-primaryWhite rounded-2xl w-full max-w-lg overflow-hidden">
                <div className="flex items-center justify-between p-4 border-b border-formColorLight/20">
                    <h2 className="text-lg font-bold text-primaryBlack">
                        Ajustar imagen
                    </h2>
                    <button
                        onClick={onCancel}
                        className="w-8 h-8 rounded-full bg-formColorLight/20 flex items-center justify-center text-primaryBlack/60 hover:bg-formColorLight/30 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="relative h-80 bg-formColorLight/20">
                    <Cropper
                        image={imageSrc}
                        crop={crop}
                        zoom={zoom}
                        rotation={rotation}
                        aspect={1}
                        onCropChange={setCrop}
                        onZoomChange={setZoom}
                        onCropComplete={onCropComplete}
                        onRotationChange={setRotation}
                        classes={{
                            containerClassName: 'cropper-container',
                            mediaClassName: 'cropper-media',
                        }}
                        cropShape={cropShape}
                        showGrid={true}
                    />
                </div>

                <div className="p-4 border-t border-formColorLight/20 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-primaryBlack mb-2">
                            Zoom: {Math.round(zoom * 100)}%
                        </label>
                        <input
                            type="range"
                            min={1}
                            max={3}
                            step={0.1}
                            value={zoom}
                            onChange={(e) => setZoom(Number(e.target.value))}
                            className="w-full accent-redPink"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-primaryBlack mb-2">
                            Rotación: {rotation}°
                        </label>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() =>
                                    setRotation((r) => (r - 90) % 360)
                                }
                                className="w-10 h-10 rounded-full bg-formColorLight/20 flex items-center justify-center text-primaryBlack/60 hover:bg-formColorLight/30 transition-colors"
                            >
                                <RotateCw className="w-5 h-5" />
                            </button>
                            <input
                                type="range"
                                min={0}
                                max={360}
                                step={15}
                                value={rotation}
                                onChange={(e) =>
                                    setRotation(Number(e.target.value))
                                }
                                className="flex-1 accent-redPink"
                            />
                        </div>
                    </div>

                    <button
                        onClick={getCroppedImg}
                        disabled={isProcessing}
                        className="w-full py-3 bg-linear-to-r from-formColorDark to-redPink text-white font-semibold rounded-xl hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-formColorDark/30"
                    >
                        {isProcessing ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Procesando...
                            </>
                        ) : (
                            'Aplicar'
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}

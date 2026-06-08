import { Loader2, AlertTriangle, Flag, Trash2 } from 'lucide-react';

interface ConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    type: 'delete' | 'report';
    isLoading?: boolean;
    title?: string;
    message?: string;
    confirmText?: string;
}

export default function ConfirmModal({
    isOpen,
    onClose,
    onConfirm,
    type,
    isLoading,
    title,
    message,
    confirmText,
}: ConfirmModalProps) {
    if (!isOpen) return null;

    const isDelete = type === 'delete';

    return (
        <div className="fixed inset-0 bg-primaryBlack/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-primaryWhite rounded-2xl shadow-2xl w-full max-w-sm p-6 border border-formColorLight/20">
                <div className="text-center">
                    <div
                        className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${
                            isDelete ? 'bg-red-100' : 'bg-formColorLight/20'
                        }`}
                    >
                        {isLoading ? (
                            <Loader2 className="w-8 h-8 text-formColorDark animate-spin" />
                        ) : isDelete ? (
                            <Trash2 className="w-8 h-8 text-redPink" />
                        ) : (
                            <Flag className="w-8 h-8 text-formColorDark" />
                        )}
                    </div>

                    <h3 className="text-lg font-bold text-primaryBlack mb-2">
                        {title || (isDelete
                            ? 'Eliminar publicación'
                            : 'Reportar publicación')}
                    </h3>

                    <p className="text-primaryBlack/60 mb-6">
                        {message || (isDelete
                            ? '¿Estás seguro de que quieres eliminar esta publicación? Esta acción no se puede deshacer.'
                            : '¿Quieres reportar esta publicación? Los administradores revisarán tu reporte.')}
                    </p>

                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            disabled={isLoading}
                            className="flex-1 px-4 py-3 border cursor-pointer border-formColorLight/30 rounded-xl text-primaryBlack font-medium hover:bg-formColorLight/10 transition-colors disabled:opacity-50"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={onConfirm}
                            disabled={isLoading}
                            className={`flex-1 px-4 py-3 cursor-pointer rounded-xl text-white font-medium transition-all shadow-lg disabled:opacity-50 ${
                                isDelete
                                    ? 'bg-redPink hover:bg-redPink/90 shadow-redPink/30'
                                    : 'bg-formColorDark hover:bg-formColorDark/90 shadow-formColorDark/30'
                            }`}
                        >
                            {confirmText || (isDelete ? 'Eliminar' : 'Reportar')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

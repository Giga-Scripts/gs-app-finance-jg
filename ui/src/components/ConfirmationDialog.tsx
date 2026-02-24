interface ConfirmationDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmationDialog({
  isOpen,
  title,
  message,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
}: ConfirmationDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 bg-black/80 flex items-center justify-center p-6 z-[100] animate-fadeIn">
      <div className="bg-neutral-900 border border-white/10 rounded-3xl p-6 w-full space-y-6 shadow-2xl animate-zoomIn">
        <div className="space-y-2 text-center">
          <h3 className="text-[#C9A96E] text-xs font-bold uppercase tracking-[0.2em]">{title}</h3>
          <p className="text-white/60 text-xs leading-relaxed">{message}</p>
        </div>

        <div className="space-y-2">
          <button
            onClick={onConfirm}
            className="w-full py-3 bg-[#C9A96E] text-black text-[10px] font-bold uppercase tracking-[0.2em] rounded-xl active:bg-[#B8985D] transition-colors"
          >
            {confirmLabel}
          </button>
          <button
            onClick={onCancel}
            className="w-full py-3 bg-white/5 text-white/60 text-[10px] font-bold uppercase tracking-[0.2em] rounded-xl active:bg-white/10 transition-colors"
          >
            {cancelLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

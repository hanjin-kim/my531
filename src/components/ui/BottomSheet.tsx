import { type ReactNode, useEffect, useRef } from 'react';

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}

export function BottomSheet({ open, onClose, title, children }: BottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div
        ref={sheetRef}
        className="relative w-full max-h-[85vh] bg-[var(--color-surface)] rounded-t-3xl overflow-y-auto animate-[slideUp_0.3s_ease-out]"
        style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 1rem)' }}
      >
        <div className="sticky top-0 bg-[var(--color-surface)] pt-3 pb-2 px-4 z-10">
          <div className="w-10 h-1 rounded-full bg-[var(--color-border)] mx-auto mb-3" />
          {title && <h2 className="text-lg font-semibold text-center">{title}</h2>}
        </div>
        <div className="px-4 pb-4">
          {children}
        </div>
      </div>
    </div>
  );
}

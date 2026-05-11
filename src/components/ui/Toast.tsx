import { useEffect } from 'react';

interface ToastProps {
  message: string;
  subtext?: string;
  visible: boolean;
  onDismiss: () => void;
  duration?: number;
}

export function Toast({ message, subtext, visible, onDismiss, duration = 3000 }: ToastProps) {
  useEffect(() => {
    if (!visible) return;
    const timer = setTimeout(onDismiss, duration);
    return () => clearTimeout(timer);
  }, [visible, onDismiss, duration]);

  if (!visible) return null;

  return (
    <div className="fixed top-12 left-1/2 -translate-x-1/2 z-50 animate-[slideDown_0.3s_ease-out]">
      <div className="bg-[var(--color-warning)] text-black rounded-2xl px-5 py-3 shadow-lg text-center">
        <p className="font-bold text-base">{message}</p>
        {subtext && <p className="text-sm opacity-80">{subtext}</p>}
      </div>
    </div>
  );
}

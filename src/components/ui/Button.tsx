import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  children: ReactNode;
  fullWidth?: boolean;
}

const variantStyles: Record<Variant, string> = {
  primary: 'bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white shadow-[0_0_12px_rgba(79,143,247,0.3)]',
  secondary: 'bg-[var(--color-surface-elevated)] hover:bg-[var(--color-border)] text-[var(--color-text)] border border-[var(--color-border)]',
  danger: 'bg-[var(--color-danger)] hover:bg-red-600 text-white shadow-[0_0_12px_rgba(248,113,113,0.25)]',
  ghost: 'bg-transparent hover:bg-[var(--color-surface-elevated)] text-[var(--color-text-secondary)]',
};

const sizeStyles: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2.5 text-base',
  lg: 'px-6 py-3.5 text-lg',
};

export function Button({ variant = 'primary', size = 'md', fullWidth, className = '', children, disabled, ...props }: ButtonProps) {
  return (
    <button
      className={`rounded-xl font-medium transition-colors duration-150 active:scale-[0.97] disabled:opacity-40 disabled:pointer-events-none ${variantStyles[variant]} ${sizeStyles[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}

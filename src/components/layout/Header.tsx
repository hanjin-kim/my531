import type { ReactNode } from 'react';

interface HeaderProps {
  title: string;
  subtitle?: string;
  right?: ReactNode;
}

export function Header({ title, subtitle, right }: HeaderProps) {
  return (
    <header className="px-4 pt-2 pb-3">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">{title}</h1>
          {subtitle && <p className="text-sm text-[var(--color-text-secondary)]">{subtitle}</p>}
        </div>
        {right}
      </div>
    </header>
  );
}

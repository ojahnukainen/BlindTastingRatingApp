import type { ButtonHTMLAttributes } from 'react';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary';
};

const VARIANTS: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary: 'bg-slate-900 text-white hover:bg-slate-700',
  secondary: 'border border-slate-300 bg-white text-slate-900 hover:border-slate-400',
};

export function Button({ variant = 'primary', className = '', ...props }: ButtonProps) {
  return (
    <button
      {...props}
      className={[
        'rounded-md px-4 py-2 text-sm font-semibold shadow-sm transition',
        'disabled:cursor-not-allowed disabled:opacity-40',
        VARIANTS[variant],
        className,
      ].join(' ')}
    />
  );
}

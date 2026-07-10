import type { InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export function Input({ label, error, required, className = '', ...props }: InputProps) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-slate-700">
        {label}
        {required ? (
          <span className="ml-1 text-red-500" aria-hidden="true">
            *
          </span>
        ) : null}
      </span>

      <input
        className={[
          'h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none transition placeholder:text-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100',
          error ? 'border-red-400 focus:border-red-500 focus:ring-red-100' : '',
          className,
        ].join(' ')}
        required={required}
        {...props}
      />

      {error ? (
        <span className="mt-1 block text-xs text-red-600">{error}</span>
      ) : null}
    </label>
  );
}
'use client';
import { forwardRef, InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = '', ...props }, ref) => (
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <label className="text-xs font-medium text-ink-muted uppercase tracking-wider">
          {label}
        </label>
      )}
      <input
        ref={ref}
        className={`
          w-full bg-bg-elevated border border-bg-border rounded-lg px-3 py-2.5
          text-sm text-ink placeholder:text-ink-faint
          focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent/50
          transition-all duration-150
          ${error ? 'border-status-failed/50 focus:ring-status-failed/30' : ''}
          ${className}
        `}
        {...props}
      />
      {error && <p className="text-xs text-status-failed">{error}</p>}
    </div>
  )
);
Input.displayName = 'Input';

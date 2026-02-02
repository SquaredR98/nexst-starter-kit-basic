import React, { forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, type, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            {label}
          </label>
        )}
        <input
          type={type}
          className={cn(
            'flex h-12 w-full rounded-lg border border-black/20 bg-white px-4 py-3 text-base text-black',
            'placeholder:text-gray-400',
            'transition-all duration-200',
            'focus:outline-none focus:border-black/40',
            'hover:border-black/30',
            'disabled:cursor-not-allowed disabled:opacity-60 disabled:bg-gray-50',
            error && 'border-red-500/40 focus:border-red-500/60',
            className
          )}
          ref={ref}
          {...props}
        />
        {error && (
          <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;

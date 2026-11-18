import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', label, error, helperText, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-xs font-bold text-gray-700 mb-1.5 ml-1">
            {label}
            {props.required && <span className="text-primary ml-1">*</span>}
          </label>
        )}
        <input
          ref={ref}
          className={`w-full rounded-2xl border px-4 py-3 text-sm text-gray-800 placeholder-gray-400 bg-white transition-all duration-200 outline-none ${
            error
              ? 'border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-100'
              : 'border-pink-100/80 focus:border-primary focus:ring-2 focus:ring-primary/15'
          } ${className}`}
          {...props}
        />
        {error && <p className="text-xs text-red-500 mt-1 ml-1">{error}</p>}
        {helperText && !error && <p className="text-xs text-gray-400 mt-1 ml-1">{helperText}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';


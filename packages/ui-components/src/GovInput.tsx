import React from 'react';

interface GovInputProps {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  type?: 'text' | 'email' | 'tel' | 'number' | 'date' | 'password';
  value?: string | number;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
  placeholder?: string;
  className?: string;
  width?: 'full' | 'three-quarters' | 'two-thirds' | 'one-half' | 'one-third' | 'one-quarter';
}

export function GovInput({
  id,
  label,
  hint,
  error,
  type = 'text',
  value,
  onChange,
  required = false,
  placeholder,
  className = '',
  width = 'full',
}: GovInputProps) {
  const widthClasses = {
    'full': 'w-full',
    'three-quarters': 'w-3/4',
    'two-thirds': 'w-2/3',
    'one-half': 'w-1/2',
    'one-third': 'w-1/3',
    'one-quarter': 'w-1/4',
  };

  return (
    <div className={`govuk-form-group mb-6 ${error ? 'border-l-4 border-red-700 pl-4' : ''} ${className}`}>
      <label htmlFor={id} className="block text-base font-bold text-gray-900 mb-1">
        {label}
        {required && <span className="text-red-700 ml-1" aria-hidden="true">*</span>}
      </label>
      {hint && (
        <div id={`${id}-hint`} className="text-gray-600 text-sm mb-2">
          {hint}
        </div>
      )}
      {error && (
        <p id={`${id}-error`} className="text-red-700 text-sm font-bold mb-2" role="alert">
          <span className="sr-only">Error:</span> {error}
        </p>
      )}
      <input
        id={id}
        name={id}
        type={type}
        value={value}
        onChange={onChange}
        required={required}
        placeholder={placeholder}
        className={`${widthClasses[width]} border-2 ${error ? 'border-red-700' : 'border-gray-900'} p-2 text-base focus:outline-2 focus:outline-yellow-400 focus:outline-offset-0`}
        aria-describedby={[hint ? `${id}-hint` : '', error ? `${id}-error` : ''].filter(Boolean).join(' ') || undefined}
        aria-invalid={!!error}
      />
    </div>
  );
}

import React from 'react';

interface GovSelectOption {
  value: string;
  label: string;
}

interface GovSelectProps {
  id: string;
  label: string;
  options: GovSelectOption[];
  hint?: string;
  error?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  required?: boolean;
  placeholder?: string;
  className?: string;
}

export function GovSelect({
  id,
  label,
  options,
  hint,
  error,
  value,
  onChange,
  required = false,
  placeholder = 'Select an option',
  className = '',
}: GovSelectProps) {
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
      <select
        id={id}
        name={id}
        value={value}
        onChange={onChange}
        required={required}
        className={`w-full border-2 ${error ? 'border-red-700' : 'border-gray-900'} p-2 text-base bg-white focus:outline-2 focus:outline-yellow-400 focus:outline-offset-0`}
        aria-describedby={[hint ? `${id}-hint` : '', error ? `${id}-error` : ''].filter(Boolean).join(' ') || undefined}
        aria-invalid={!!error}
      >
        <option value="">{placeholder}</option>
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );
}

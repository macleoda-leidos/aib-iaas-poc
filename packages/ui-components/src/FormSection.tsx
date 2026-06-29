import React from 'react';

interface FormSectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export function FormSection({ title, description, children, className = '' }: FormSectionProps) {
  return (
    <fieldset className={`govuk-fieldset mb-8 ${className}`}>
      <legend className="govuk-fieldset__legend">
        <h2 className="text-xl font-bold text-gray-900 mb-1">{title}</h2>
        {description && (
          <p className="text-gray-600 text-base mb-4">{description}</p>
        )}
      </legend>
      <div className="mt-4">{children}</div>
    </fieldset>
  );
}

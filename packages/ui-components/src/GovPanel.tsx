import React from 'react';

interface GovPanelProps {
  title?: string;
  children: React.ReactNode;
  variant?: 'default' | 'confirmation' | 'info' | 'warning';
  className?: string;
}

export function GovPanel({ title, children, variant = 'default', className = '' }: GovPanelProps) {
  const variantStyles = {
    default: 'bg-white border border-gray-300',
    confirmation: 'bg-green-700 text-white text-center',
    info: 'bg-blue-50 border-l-4 border-blue-700',
    warning: 'bg-yellow-50 border-l-4 border-yellow-600',
  };

  return (
    <div className={`govuk-panel p-6 mb-6 ${variantStyles[variant]} ${className}`} role="region" aria-label={title}>
      {title && (
        <h2 className={`text-xl font-bold mb-3 ${variant === 'confirmation' ? 'text-white text-3xl' : 'text-gray-900'}`}>
          {title}
        </h2>
      )}
      <div className={variant === 'confirmation' ? 'text-lg' : ''}>{children}</div>
    </div>
  );
}

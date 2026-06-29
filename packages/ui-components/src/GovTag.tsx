import React from 'react';

interface GovTagProps {
  children: React.ReactNode;
  colour?: 'grey' | 'green' | 'turquoise' | 'blue' | 'purple' | 'pink' | 'red' | 'orange' | 'yellow';
  className?: string;
}

export function GovTag({ children, colour = 'grey', className = '' }: GovTagProps) {
  const colourStyles = {
    grey: 'bg-gray-200 text-gray-700',
    green: 'bg-green-100 text-green-800',
    turquoise: 'bg-teal-100 text-teal-800',
    blue: 'bg-blue-100 text-blue-800',
    purple: 'bg-purple-100 text-purple-800',
    pink: 'bg-pink-100 text-pink-800',
    red: 'bg-red-100 text-red-800',
    orange: 'bg-orange-100 text-orange-800',
    yellow: 'bg-yellow-100 text-yellow-800',
  };

  return (
    <strong className={`govuk-tag inline-block px-2 py-1 text-xs font-bold uppercase tracking-wide ${colourStyles[colour]} ${className}`}>
      {children}
    </strong>
  );
}

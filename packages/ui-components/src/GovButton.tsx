import React from 'react';

interface GovButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'warning';
  disabled?: boolean;
  loading?: boolean;
  type?: 'button' | 'submit' | 'reset';
  onClick?: () => void;
  className?: string;
}

export function GovButton({
  children,
  variant = 'primary',
  disabled = false,
  loading = false,
  type = 'button',
  onClick,
  className = '',
}: GovButtonProps) {
  const baseStyles = 'govuk-button font-bold py-3 px-6 rounded-none border-b-2 cursor-pointer text-base transition-colors focus:outline-2 focus:outline-offset-0 focus:outline-yellow-400';

  const variantStyles = {
    primary: 'bg-green-700 text-white border-green-900 hover:bg-green-800 active:bg-green-900',
    secondary: 'bg-gray-200 text-gray-900 border-gray-400 hover:bg-gray-300 active:bg-gray-400',
    warning: 'bg-red-700 text-white border-red-900 hover:bg-red-800 active:bg-red-900',
  };

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={`${baseStyles} ${variantStyles[variant]} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
      aria-disabled={disabled || loading}
    >
      {loading ? (
        <span className="flex items-center gap-2">
          <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
          Loading...
        </span>
      ) : children}
    </button>
  );
}

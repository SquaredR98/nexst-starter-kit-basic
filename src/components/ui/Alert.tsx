import React from 'react';

interface AlertProps {
  type: 'error' | 'success';
  message: string;
  className?: string;
}

export const Alert: React.FC<AlertProps> = ({ type, message, className }) => {
  const base = 'rounded px-4 py-3 mb-2 text-sm font-medium';
  const color =
    type === 'error'
      ? 'bg-red-100 text-red-800 border border-red-300'
      : 'bg-green-100 text-green-800 border border-green-300';
  return (
    <div className={`${base} ${color} ${className || ''}`.trim()} role="alert">
      {message}
    </div>
  );
}; 
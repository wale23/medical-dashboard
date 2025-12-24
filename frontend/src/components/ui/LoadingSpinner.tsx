import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: 'primary' | 'secondary' | 'gray' | 'white';
  text?: string;
  className?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  color = 'primary',
  text,
  className = '',
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16',
  };

  const colorClasses = {
    primary: 'border-blue-700',
    secondary: 'border-blue-600',
    gray: 'border-gray-400',
    white: 'border-white',
  };

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
    xl: 'text-lg',
  };

  return (
    <div className={`flex items-center justify-center h-full ${className}`}>
      <div className="text-center">
        <div
          className={`animate-spin rounded-full border-b-2 ${sizeClasses[size]} ${colorClasses[color]} mx-auto ${
            text ? 'mb-4' : ''
          }`}
        ></div>
        {text && (
          <p className={`text-gray-600 ${textSizeClasses[size]}`}>{text}</p>
        )}
      </div>
    </div>
  );
};

export default LoadingSpinner;
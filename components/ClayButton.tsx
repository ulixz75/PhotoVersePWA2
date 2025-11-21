import React from 'react';

interface ClayButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  fullWidth?: boolean;
  color?: 'primary' | 'secondary' | 'accent';
}

const colorClasses = {
    primary: 'bg-primary text-surface shadow-primary-dark/30 hover:bg-primary-dark',
    secondary: 'bg-secondary text-text-dark shadow-secondary/50 hover:bg-secondary-dark',
    accent: 'bg-accent text-text-dark shadow-accent/50 hover:bg-accent-dark',
}

const ClayButton: React.FC<ClayButtonProps> = ({ children, fullWidth = true, color = 'primary', className, ...props }) => {
  const widthClass = fullWidth ? 'w-full' : 'px-6';
  const baseClasses = 'h-14 flex items-center justify-center rounded-3xl font-bold text-lg border transition-all duration-200 ease-in-out transform focus:outline-none active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100';
  
  const selectedColor = colorClasses[color];

  const clayStyle = `border-shadow-light/50 shadow-clay-sm`;

  return (
    <button
      className={`${baseClasses} ${widthClass} ${selectedColor} ${clayStyle} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export default ClayButton;
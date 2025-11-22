import { ButtonHTMLAttributes, ReactNode } from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'icon' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: ReactNode;
  fullWidth?: boolean;
}

export function Button({
  variant = 'primary',
  size = 'md',
  children,
  fullWidth = false,
  className = '',
  ...props
}: ButtonProps) {
  const baseClasses = 'inline-flex items-center justify-center font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-vscode-focusBorder disabled:opacity-50 disabled:cursor-not-allowed';

  const variantClasses: Record<ButtonVariant, string> = {
    primary: 'bg-vscode-button-bg text-vscode-button-fg hover:bg-vscode-button-hoverBg',
    secondary: 'bg-vscode-button-secondaryBg text-vscode-button-secondaryFg hover:bg-vscode-button-secondaryHoverBg',
    icon: 'bg-transparent hover:bg-vscode-toolbar-hoverBg text-vscode-foreground',
    ghost: 'bg-transparent hover:bg-vscode-list-hoverBg text-vscode-foreground',
  };

  const sizeClasses: Record<ButtonSize, string> = {
    sm: 'px-2 py-1 text-xs rounded',
    md: 'px-3 py-2 text-sm rounded',
    lg: 'px-4 py-3 text-base rounded-md',
  };

  const widthClass = fullWidth ? 'w-full' : '';

  const classes = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${widthClass} ${className}`.trim();

  return (
    <button className={classes} {...props}>
      oi-{children}
    </button>
  );
}

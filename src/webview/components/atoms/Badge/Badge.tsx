import { HTMLAttributes } from 'react';

export type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'info';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  children: React.ReactNode;
}

export function Badge({
  variant = 'default',
  children,
  className = '',
  ...props
}: BadgeProps) {
  const baseClasses = 'inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full';

  const variantClasses: Record<BadgeVariant, string> = {
    default: 'bg-vscode-badge-bg text-vscode-badge-fg',
    success: 'bg-green-600 text-white',
    warning: 'bg-yellow-600 text-white',
    error: 'bg-red-600 text-white',
    info: 'bg-blue-600 text-white',
  };

  const classes = `${baseClasses} ${variantClasses[variant]} ${className}`.trim();

  return (
    <span className={classes} {...props}>
      {children}
    </span>
  );
}

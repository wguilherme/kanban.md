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
    success: 'bg-vscode-success text-vscode-badge-fg',
    warning: 'bg-vscode-warning text-vscode-badge-fg',
    error: 'bg-vscode-error text-vscode-badge-fg',
    info: 'bg-vscode-info text-vscode-badge-fg',
  };

  const classes = `${baseClasses} ${variantClasses[variant]} ${className}`.trim();

  return (
    <span className={classes} {...props}>
      {children}
    </span>
  );
}

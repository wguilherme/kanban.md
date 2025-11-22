import { HTMLAttributes } from 'react';

export interface IconProps extends HTMLAttributes<HTMLSpanElement> {
  name: string;
  size?: 'sm' | 'md' | 'lg';
}

export function Icon({ name, size = 'md', className = '', ...props }: IconProps) {
  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
  };

  const classes = `codicon codicon-${name} ${sizeClasses[size]} ${className}`.trim();

  return <span className={classes} {...props} />;
}

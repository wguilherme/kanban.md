import { InputHTMLAttributes, forwardRef } from 'react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
  fullWidth?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ error = false, fullWidth = false, className = '', ...props }, ref) => {
    const baseClasses = 'px-3 py-2 rounded border transition-colors focus:outline-none focus:ring-2 focus:ring-vscode-focusBorder';

    const stateClasses = error
      ? 'border-vscode-inputValidation-errorBorder bg-vscode-inputValidation-errorBg'
      : 'border-vscode-input-border bg-vscode-input-bg';

    const textClasses = 'text-vscode-input-fg placeholder:text-vscode-input-placeholderFg';
    const widthClass = fullWidth ? 'w-full' : '';

    const classes = `${baseClasses} ${stateClasses} ${textClasses} ${widthClass} ${className}`.trim();

    return <input ref={ref} className={classes} {...props} />;
  }
);

Input.displayName = 'Input';

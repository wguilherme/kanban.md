import { InputHTMLAttributes, forwardRef } from 'react';

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, className = '', ...props }, ref) => {
    const checkboxClasses = 'w-4 h-4 rounded border border-vscode-checkbox-border bg-vscode-checkbox-bg checked:bg-vscode-checkbox-selectBg focus:ring-2 focus:ring-vscode-focusBorder cursor-pointer';

    const containerClasses = `inline-flex items-center gap-2 ${className}`.trim();

    if (label) {
      return (
        <label className={containerClasses}>
          <input
            ref={ref}
            type="checkbox"
            className={checkboxClasses}
            {...props}
          />
          <span className="text-sm text-vscode-foreground select-none cursor-pointer">
            {label}
          </span>
        </label>
      );
    }

    return (
      <input
        ref={ref}
        type="checkbox"
        className={checkboxClasses}
        {...props}
      />
    );
  }
);

Checkbox.displayName = 'Checkbox';

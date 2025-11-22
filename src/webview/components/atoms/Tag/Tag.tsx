import { HTMLAttributes } from 'react';

export interface TagProps extends HTMLAttributes<HTMLSpanElement> {
  label: string;
  color?: string;
  removable?: boolean;
  onRemove?: () => void;
}

export function Tag({
  label,
  color,
  removable = false,
  onRemove,
  className = '',
  ...props
}: TagProps) {
  const baseClasses = 'inline-flex items-center gap-1 px-2 py-1 text-xs rounded font-medium';
  const colorClasses = color
    ? ''
    : 'bg-vscode-badge-bg text-vscode-badge-fg';

  const classes = `${baseClasses} ${colorClasses} ${className}`.trim();

  const style = color ? { backgroundColor: color, color: '#fff' } : undefined;

  return (
    <span className={classes} style={style} {...props}>
      <span>{label}</span>
      {removable && onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="ml-1 hover:opacity-70 focus:outline-none"
          aria-label={`Remove ${label} tag`}
        >
          ×
        </button>
      )}
    </span>
  );
}

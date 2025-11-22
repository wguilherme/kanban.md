/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/webview/**/*.{ts,tsx}",
    "./src/webview/index.html",
  ],
  theme: {
    extend: {
      colors: {
        // VSCode theme colors
        'vscode-foreground': 'var(--vscode-foreground)',
        'vscode-background': 'var(--vscode-editor-background)',
        'vscode-button-bg': 'var(--vscode-button-background)',
        'vscode-button-fg': 'var(--vscode-button-foreground)',
        'vscode-button-hoverBg': 'var(--vscode-button-hoverBackground)',
        'vscode-button-secondaryBg': 'var(--vscode-button-secondaryBackground)',
        'vscode-button-secondaryFg': 'var(--vscode-button-secondaryForeground)',
        'vscode-button-secondaryHoverBg': 'var(--vscode-button-secondaryHoverBackground)',
        'vscode-input-bg': 'var(--vscode-input-background)',
        'vscode-input-fg': 'var(--vscode-input-foreground)',
        'vscode-input-border': 'var(--vscode-input-border)',
        'vscode-input-placeholderFg': 'var(--vscode-input-placeholderForeground)',
        'vscode-inputValidation-errorBg': 'var(--vscode-inputValidation-errorBackground)',
        'vscode-inputValidation-errorBorder': 'var(--vscode-inputValidation-errorBorder)',
        'vscode-focusBorder': 'var(--vscode-focusBorder)',
        'vscode-badge-bg': 'var(--vscode-badge-background)',
        'vscode-badge-fg': 'var(--vscode-badge-foreground)',
        'vscode-checkbox-bg': 'var(--vscode-checkbox-background)',
        'vscode-checkbox-border': 'var(--vscode-checkbox-border)',
        'vscode-checkbox-selectBg': 'var(--vscode-checkbox-selectBackground)',
        'vscode-toolbar-hoverBg': 'var(--vscode-toolbar-hoverBackground)',
        'vscode-list-hoverBg': 'var(--vscode-list-hoverBackground)',
        // Semantic colors for variants
        'vscode-primary': 'var(--vscode-activityBarBadge-background)',
        'vscode-success': 'var(--vscode-testing-iconPassed)',
        'vscode-error': 'var(--vscode-testing-iconFailed)',
        'vscode-warning': 'var(--vscode-notificationsWarningIcon-foreground)',
        'vscode-info': 'var(--vscode-notificationsInfoIcon-foreground)',
      },
    },
  },
  plugins: [],
}

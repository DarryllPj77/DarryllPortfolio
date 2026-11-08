import styles from './Button.module.css';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost';
export type ButtonSize = 'md' | 'sm' | 'icon';

/** Shared button look for <button>, <a> and router <Link> elements. */
export function buttonClass(variant: ButtonVariant = 'secondary', size: ButtonSize = 'md'): string {
  return [styles.button, styles[variant], size !== 'md' ? styles[size] : '']
    .filter(Boolean)
    .join(' ');
}

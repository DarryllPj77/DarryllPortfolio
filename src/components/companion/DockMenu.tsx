import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react';
import { avatarDocks } from '../../data/avatarDocks';
import { useCompanion } from './companionContext';
import styles from './DockMenu.module.css';

interface DockMenuProps {
  /** Button text. */
  label: string;
  /** Opens above the button (status bar) or below it (hero). */
  placement: 'up' | 'down';
  /** Style for the button, so it matches where the menu sits. */
  buttonClassName?: string;
}

/**
 * The keyboard and screen-reader way to move Darryll's avatar (dragging is never
 * the only way): a menu of destinations, plus "Bring the avatar back" while it is out.
 * Arrow keys move between items, Escape closes and returns focus to the button.
 */
export function DockMenu({ label, placement, buttonClassName }: DockMenuProps) {
  const companion = useCompanion();
  const [open, setOpen] = useState(false);
  const button = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLUListElement>(null);
  const id = useId();
  const here = companion.location.kind === 'dock' ? companion.location.id : companion.location.kind === 'hero' ? 'home' : null;

  // Focus the current destination (or the first) when the menu opens; close on an outside press.
  useEffect(() => {
    if (!open) return;
    const items = menu.current?.querySelectorAll<HTMLButtonElement>('button');
    (menu.current?.querySelector<HTMLButtonElement>('[aria-checked="true"]') ?? items?.[0])?.focus();
    const outside = (e: PointerEvent) => {
      const target = e.target as Node;
      if (!menu.current?.contains(target) && !button.current?.contains(target)) setOpen(false);
    };
    window.addEventListener('pointerdown', outside);
    return () => window.removeEventListener('pointerdown', outside);
  }, [open]);

  const close = (refocus: boolean) => {
    setOpen(false);
    if (refocus) button.current?.focus();
  };

  const onMenuKey = (e: KeyboardEvent<HTMLUListElement>) => {
    const items = Array.from(menu.current?.querySelectorAll<HTMLButtonElement>('button') ?? []);
    const i = items.indexOf(document.activeElement as HTMLButtonElement);
    const next = { ArrowDown: i + 1, ArrowUp: i - 1, Home: 0, End: items.length - 1 }[e.key];
    if (e.key === 'Escape' || e.key === 'Tab') {
      if (e.key === 'Escape') e.preventDefault();
      close(e.key === 'Escape');
    } else if (next !== undefined) {
      e.preventDefault();
      items[(next + items.length) % items.length]?.focus();
    }
  };

  const choose = (action: () => void) => {
    close(true);
    action();
  };

  return (
    <div className={styles.wrap} data-placement={placement}>
      <button
        ref={button}
        type="button"
        className={`${styles.button} ${buttonClassName ?? ''}`}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? id : undefined}
        onClick={() => setOpen((o) => !o)}
      >
        {label}
      </button>
      {open ? (
        <ul ref={menu} id={id} role="menu" aria-label="Move the avatar to" className={styles.menu} onKeyDown={onMenuKey}>
          {avatarDocks.map((dock) => (
            <li key={dock.id} role="none">
              <button
                type="button"
                role="menuitemradio"
                aria-checked={here === dock.id}
                className={styles.item}
                onClick={() => choose(() => companion.sendTo(dock.id))}
              >
                {dock.label}
              </button>
            </li>
          ))}
          {companion.mode === 'mini' ? (
            <li role="none" className={styles.separated}>
              <button type="button" role="menuitem" className={styles.item} onClick={() => choose(companion.dismiss)}>
                Bring the avatar back
              </button>
            </li>
          ) : null}
        </ul>
      ) : null}
    </div>
  );
}

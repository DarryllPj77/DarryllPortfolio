import { useState, type CSSProperties, type KeyboardEvent } from 'react';
import { NavLink } from 'react-router';
import { navTree, normalizePath, type NavItem } from '../../data/navigation';
import { Icon } from '../ui/Icon';
import styles from './Explorer.module.css';

interface ExplorerProps {
  pathname: string;
  /** Called after a link is chosen (used to close overlay/drawer layouts). */
  onNavigate?: () => void;
}

/** Arrow keys move between links, like a file tree. Tab still works as normal. */
function handleTreeKeys(event: KeyboardEvent<HTMLElement>) {
  const keys = ['ArrowDown', 'ArrowUp', 'Home', 'End'];
  if (!keys.includes(event.key)) return;
  const links = Array.from(event.currentTarget.querySelectorAll<HTMLAnchorElement>('a[href]'));
  const index = links.indexOf(document.activeElement as HTMLAnchorElement);
  if (index === -1 && event.key !== 'Home' && event.key !== 'End') return;
  event.preventDefault();
  let next = index;
  if (event.key === 'ArrowDown') next = Math.min(links.length - 1, index + 1);
  if (event.key === 'ArrowUp') next = Math.max(0, index - 1);
  if (event.key === 'Home') next = 0;
  if (event.key === 'End') next = links.length - 1;
  links[next]?.focus();
}

export function Explorer({ pathname, onNavigate }: ExplorerProps) {
  const current = normalizePath(pathname);
  return (
    <div className={styles.explorer}>
      <p className={styles.heading}>Explorer</p>
      <nav aria-label="Portfolio sections" onKeyDown={handleTreeKeys}>
        <p className={styles.root}>
          <Icon name="chevron-down" size={14} />
          Portfolio
        </p>
        <ul role="list" className={styles.list}>
          {navTree.map((item) => (
            <ExplorerItem key={item.id} item={item} current={current} onNavigate={onNavigate} />
          ))}
        </ul>
      </nav>
    </div>
  );
}

interface ExplorerItemProps {
  item: NavItem;
  current: string;
  depth?: number;
  onNavigate?: () => void;
}

function ExplorerItem({ item, current, depth = 0, onNavigate }: ExplorerItemProps) {
  const hasChildren = Boolean(item.children?.length);
  const containsCurrent = hasChildren && current.startsWith(`${item.path}/`);
  const [expanded, setExpanded] = useState(true);
  const isOpen = expanded || containsCurrent;
  const groupId = `explorer-group-${item.id}`;
  const icon = hasChildren ? (isOpen ? 'folder-open' : 'folder') : item.icon;

  return (
    <li>
      <div
        className={styles.row}
        style={{ '--depth': depth } as CSSProperties}
        data-contains-current={containsCurrent || undefined}
      >
        {hasChildren ? (
          <button
            type="button"
            className={styles.toggle}
            aria-expanded={isOpen}
            aria-controls={groupId}
            aria-label={`${isOpen ? 'Collapse' : 'Expand'} ${item.label}`}
            onClick={() => setExpanded(!isOpen)}
            disabled={containsCurrent}
          >
            <Icon name={isOpen ? 'chevron-down' : 'chevron-right'} size={14} />
          </button>
        ) : (
          <span className={styles.spacer} aria-hidden="true" />
        )}
        <NavLink to={item.path} end className={styles.link} onClick={onNavigate}>
          <Icon name={icon} size={16} className={styles.icon} />
          <span className={styles.label}>{item.label}</span>
        </NavLink>
      </div>
      {hasChildren && isOpen ? (
        <ul role="list" id={groupId} className={styles.list}>
          {item.children!.map((child) => (
            <ExplorerItem
              key={child.id}
              item={child}
              current={current}
              depth={depth + 1}
              onNavigate={onNavigate}
            />
          ))}
        </ul>
      ) : null}
    </li>
  );
}

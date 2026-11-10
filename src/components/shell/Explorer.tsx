import { useState, type KeyboardEvent } from 'react';
import { Link, useLocation } from 'react-router';
import {
  explorerTree,
  normalizePath,
  type ExplorerFile,
  type ExplorerFolder,
} from '../../data/navigation';
import { Icon } from '../ui/Icon';
import styles from './Explorer.module.css';

interface ExplorerProps {
  /** Called after a file is chosen (used to close the tablet overlay). */
  onNavigate?: () => void;
}

/** Arrow keys move between rows, like a file tree. Tab still works as normal. */
function handleTreeKeys(event: KeyboardEvent<HTMLElement>) {
  if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
  const rows = Array.from(
    event.currentTarget.querySelectorAll<HTMLElement>('a[href], button'),
  );
  const index = rows.indexOf(document.activeElement as HTMLElement);
  if (index === -1 && event.key !== 'Home' && event.key !== 'End') return;
  event.preventDefault();
  const last = rows.length - 1;
  const next = {
    ArrowDown: Math.min(last, index + 1),
    ArrowUp: Math.max(0, index - 1),
    Home: 0,
    End: last,
  }[event.key as 'ArrowDown' | 'ArrowUp' | 'Home' | 'End'];
  rows[next]?.focus();
}

function useIsActive() {
  const { pathname, hash } = useLocation();
  const current = normalizePath(pathname);
  return (file: ExplorerFile) =>
    file.path === current && (file.hash ? file.hash === hash : true);
}

/** The workspace file tree: the developer-flavoured way to browse the portfolio. */
export function Explorer({ onNavigate }: ExplorerProps) {
  const isActive = useIsActive();
  return (
    <div className={styles.explorer}>
      <p className={styles.heading}>Explorer</p>
      <nav aria-label="Workspace files" onKeyDown={handleTreeKeys}>
        <p className={styles.root}>
          <Icon name="chevron-down" size={14} />
          portfolio
        </p>
        <ul role="list" className={styles.list}>
          {explorerTree.map((node) =>
            node.kind === 'folder' ? (
              <FolderRow key={node.id} folder={node} isActive={isActive} onNavigate={onNavigate} />
            ) : (
              <li key={node.id}>
                <FileRow file={node} depth={0} active={isActive(node)} onNavigate={onNavigate} />
              </li>
            ),
          )}
        </ul>
      </nav>
    </div>
  );
}

function FolderRow({
  folder,
  isActive,
  onNavigate,
}: {
  folder: ExplorerFolder;
  isActive: (file: ExplorerFile) => boolean;
  onNavigate?: () => void;
}) {
  const [open, setOpen] = useState(true);
  const containsActive = folder.children.some(isActive);
  const groupId = `explorer-${folder.id}`;
  return (
    <li>
      <button
        type="button"
        className={styles.folder}
        aria-expanded={open}
        aria-controls={groupId}
        onClick={() => setOpen(!open)}
        data-companion={`/${folder.id}`}
        data-contains-current={containsActive || undefined}
      >
        <Icon name={open ? 'chevron-down' : 'chevron-right'} size={14} className={styles.chevron} />
        <Icon name={open ? 'folder-open' : 'folder'} size={16} className={styles.folderIcon} />
        <span className={styles.label}>
          {folder.name}
          <span className={styles.slash}>/</span>
        </span>
      </button>
      {open ? (
        <ul role="list" id={groupId} className={styles.list}>
          {folder.children.map((file) => (
            <li key={file.id}>
              <FileRow file={file} depth={1} active={isActive(file)} onNavigate={onNavigate} />
            </li>
          ))}
        </ul>
      ) : null}
    </li>
  );
}

function FileRow({
  file,
  depth,
  active,
  onNavigate,
}: {
  file: ExplorerFile;
  depth: number;
  active: boolean;
  onNavigate?: () => void;
}) {
  return (
    <Link
      to={{ pathname: file.path, hash: file.hash ?? '' }}
      className={styles.file}
      data-depth={depth}
      data-tone={file.tone}
      aria-current={active ? 'page' : undefined}
      title={file.title}
      onClick={onNavigate}
      data-companion={`${file.path}${file.hash ?? ''}`}
    >
      <Icon name={file.icon} size={16} className={styles.fileIcon} />
      <span className={styles.label}>{file.name}</span>
      <span className="visually-hidden">: {file.title}</span>
    </Link>
  );
}

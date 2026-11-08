import { useRef, type KeyboardEvent, type PointerEvent } from 'react';
import {
  SIDEBAR_DEFAULT,
  SIDEBAR_MAX,
  SIDEBAR_MIN,
} from '../../hooks/useSidebarState';
import styles from './SidebarResizer.module.css';

interface SidebarResizerProps {
  width: number;
  onResize: (width: number) => void;
  onDraggingChange: (dragging: boolean) => void;
}

const STEP = 16;

/** Drag handle between the Explorer and the workspace. Also works with arrow keys. */
export function SidebarResizer({ width, onResize, onDraggingChange }: SidebarResizerProps) {
  const start = useRef<{ x: number; width: number } | null>(null);

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    start.current = { x: e.clientX, width };
    onDraggingChange(true);
  };

  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!start.current) return;
    onResize(start.current.width + (e.clientX - start.current.x));
  };

  const endDrag = () => {
    if (!start.current) return;
    start.current = null;
    onDraggingChange(false);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const actions: Record<string, number> = {
      ArrowLeft: width - STEP,
      ArrowRight: width + STEP,
      Home: SIDEBAR_MIN,
      End: SIDEBAR_MAX,
      Enter: SIDEBAR_DEFAULT,
    };
    if (e.key in actions) {
      e.preventDefault();
      onResize(actions[e.key]);
    }
  };

  return (
    <div
      role="separator"
      aria-orientation="vertical"
      aria-label="Resize explorer"
      aria-controls="explorer-panel"
      aria-valuemin={SIDEBAR_MIN}
      aria-valuemax={SIDEBAR_MAX}
      aria-valuenow={width}
      tabIndex={0}
      className={styles.resizer}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onDoubleClick={() => onResize(SIDEBAR_DEFAULT)}
      onKeyDown={onKeyDown}
      title="Drag to resize · double-click to reset"
    />
  );
}

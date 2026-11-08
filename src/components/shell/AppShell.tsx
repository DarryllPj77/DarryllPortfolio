import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router';
import { getViewMeta } from '../../data/navigation';
import { profile } from '../../data/profile';
import { useLayoutMode } from '../../hooks/useMediaQuery';
import { useOpenTabs } from '../../hooks/useOpenTabs';
import { useSidebarState } from '../../hooks/useSidebarState';
import { ActivityRail } from './ActivityRail';
import styles from './AppShell.module.css';
import { Explorer } from './Explorer';
import { SidebarResizer } from './SidebarResizer';
import { StatusBar } from './StatusBar';
import { TabStrip } from './TabStrip';
import { TopBar } from './TopBar';
import { Workspace } from './Workspace';

const EASE = [0.2, 0.8, 0.2, 1] as const;

/**
 * The workspace shell:
 * - desktop: rail + resizable, collapsible Explorer + tabs + content
 * - tablet:  rail + Explorer as an overlay
 * - mobile:  top bar with a menu button that opens the Explorer as a drawer
 */
export function AppShell() {
  const location = useLocation();
  const meta = getViewMeta(location.pathname);
  const layout = useLayoutMode();
  const isDesktop = layout === 'desktop';
  const reduceMotion = useReducedMotion();

  const sidebar = useSidebarState();
  const [overlayOpen, setOverlayOpen] = useState(false);
  const [dragging, setDragging] = useState(false);
  const { tabs, current, close } = useOpenTabs(location.pathname);

  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLElement>(null);

  // Overlays never survive a layout change or a navigation.
  const [prev, setPrev] = useState({ layout, path: location.pathname });
  if (prev.layout !== layout || prev.path !== location.pathname) {
    setPrev({ layout, path: location.pathname });
    setOverlayOpen(false);
  }

  const explorerOpen = isDesktop ? !sidebar.collapsed : overlayOpen;
  const overlayActive = !isDesktop && overlayOpen;
  const { toggle: toggleSidebar } = sidebar;

  const toggleExplorer = useCallback(() => {
    if (isDesktop) toggleSidebar();
    else setOverlayOpen((open) => !open);
  }, [isDesktop, toggleSidebar]);

  const closeOverlay = useCallback((returnFocus: boolean) => {
    setOverlayOpen(false);
    if (returnFocus) menuButtonRef.current?.focus();
  }, []);

  useEffect(() => {
    const suffix = profile.fullName;
    document.title =
      meta.path === '/' ? `${suffix} · ${profile.focus}` : `${meta.title} · ${suffix}`;
  }, [meta.path, meta.title]);

  // Ctrl/Cmd + B toggles the Explorer; Escape closes the overlay.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && !e.altKey && !e.shiftKey && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        toggleExplorer();
      } else if (e.key === 'Escape' && overlayActive) {
        closeOverlay(true);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [toggleExplorer, overlayActive, closeOverlay]);

  // Move focus into the overlay when it opens.
  useEffect(() => {
    if (!overlayActive) return;
    const panel = panelRef.current;
    const target =
      panel?.querySelector<HTMLElement>('a[aria-current="page"]') ??
      panel?.querySelector<HTMLElement>('a[href]');
    target?.focus();
  }, [overlayActive]);

  const duration = dragging || reduceMotion ? 0 : 0.18;

  return (
    <div
      className={styles.shell}
      data-layout={layout}
      data-dragging={dragging || undefined}
    >
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <TopBar
        meta={meta}
        layout={layout}
        menuOpen={overlayActive}
        onToggleMenu={toggleExplorer}
        menuButtonRef={menuButtonRef}
      />

      <div className={styles.body}>
        {layout !== 'mobile' ? (
          <ActivityRail explorerOpen={explorerOpen} onToggleExplorer={toggleExplorer} />
        ) : null}

        <AnimatePresence initial={false}>
          {explorerOpen ? (
            <motion.aside
              key={layout}
              id="explorer-panel"
              ref={panelRef}
              aria-label="Explorer"
              className={styles.sidebar}
              initial={isDesktop ? { width: 0 } : { opacity: 0, x: -16 }}
              animate={isDesktop ? { width: sidebar.width } : { opacity: 1, x: 0 }}
              exit={isDesktop ? { width: 0 } : { opacity: 0, x: -16 }}
              transition={{ duration, ease: EASE }}
            >
              <div
                className={styles.sidebarInner}
                style={isDesktop ? { width: sidebar.width } : undefined}
              >
                <Explorer
                  pathname={location.pathname}
                  onNavigate={overlayActive ? () => setOverlayOpen(false) : undefined}
                />
              </div>
            </motion.aside>
          ) : null}
        </AnimatePresence>

        {isDesktop && explorerOpen ? (
          <SidebarResizer
            width={sidebar.width}
            onResize={sidebar.setWidth}
            onDraggingChange={setDragging}
          />
        ) : null}

        <AnimatePresence>
          {overlayActive ? (
            <motion.div
              key="scrim"
              className={styles.scrim}
              aria-hidden="true"
              onClick={() => closeOverlay(true)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: reduceMotion ? 0 : 0.15 }}
            />
          ) : null}
        </AnimatePresence>

        <div className={styles.workspace} inert={overlayActive}>
          {layout !== 'mobile' && tabs.length > 0 ? (
            <TabStrip tabs={tabs} current={current} onClose={close} />
          ) : null}
          <main id="main" tabIndex={-1} className={styles.main}>
            <Workspace />
          </main>
        </div>
      </div>

      <StatusBar meta={meta} layout={layout} />
    </div>
  );
}

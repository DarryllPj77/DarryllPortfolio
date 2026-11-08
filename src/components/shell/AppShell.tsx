import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router';
import { getViewMeta } from '../../data/navigation';
import { profile } from '../../data/profile';
import { useLayoutMode } from '../../hooks/useMediaQuery';
import { useSidebarState } from '../../hooks/useSidebarState';
import { useIntro } from '../../intro/introContext';
import { duration, ease } from '../../motion/tokens';
import { ActivityRail } from './ActivityRail';
import styles from './AppShell.module.css';
import { Explorer } from './Explorer';
import { MobileMenu } from './MobileMenu';
import { SidebarResizer } from './SidebarResizer';
import { StatusBar } from './StatusBar';
import { TopBar } from './TopBar';
import { Workspace } from './Workspace';

/**
 * The workspace shell. The page scrolls natively; the top bar, the Explorer
 * column and the status bar stay pinned.
 * - desktop: top nav + rail + resizable, collapsible Explorer
 * - tablet:  top nav + rail; Explorer opens as an overlay
 * - mobile:  top bar with a menu button; full-screen menu, no Explorer
 */
export function AppShell() {
  const location = useLocation();
  const meta = getViewMeta(location.pathname);
  const layout = useLayoutMode();
  const isDesktop = layout === 'desktop';
  const isMobile = layout === 'mobile';
  const reduceMotion = useReducedMotion();
  const intro = useIntro();

  const sidebar = useSidebarState();
  const [overlayOpen, setOverlayOpen] = useState(false);
  const [dragging, setDragging] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLElement>(null);

  // Overlays never survive a layout change or a navigation.
  const [prev, setPrev] = useState({ layout, path: location.pathname });
  if (prev.layout !== layout || prev.path !== location.pathname) {
    setPrev({ layout, path: location.pathname });
    setOverlayOpen(false);
  }

  const explorerOpen = isDesktop ? !sidebar.collapsed : !isMobile && overlayOpen;
  const overlayActive = !isDesktop && overlayOpen;
  const { toggle: toggleSidebar } = sidebar;

  const toggleExplorer = useCallback(() => {
    if (isDesktop) toggleSidebar();
    else setOverlayOpen((open) => !open);
  }, [isDesktop, toggleSidebar]);

  const closeOverlay = useCallback(
    (returnFocus: boolean) => {
      setOverlayOpen(false);
      if (returnFocus && isMobile) menuButtonRef.current?.focus();
    },
    [isMobile],
  );

  useEffect(() => {
    document.title =
      meta.path === '/'
        ? `${profile.fullName} · ${profile.focus}`
        : `${meta.title} · ${profile.fullName}`;
  }, [meta.path, meta.title]);

  // Ctrl/Cmd + B toggles the Explorer; Escape closes overlays.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && !e.altKey && !e.shiftKey && e.key.toLowerCase() === 'b') {
        if (isMobile) return;
        e.preventDefault();
        toggleExplorer();
      } else if (e.key === 'Escape' && overlayActive) {
        closeOverlay(true);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [toggleExplorer, overlayActive, closeOverlay, isMobile]);

  // Tablet: move focus into the Explorer overlay when it opens.
  useEffect(() => {
    if (!overlayActive || isMobile) return;
    const panel = panelRef.current;
    (
      panel?.querySelector<HTMLElement>('a[aria-current="page"]') ??
      panel?.querySelector<HTMLElement>('a[href]')
    )?.focus();
  }, [overlayActive, isMobile]);

  const panelDuration = dragging || reduceMotion ? 0 : duration.fast;

  return (
    <div
      className={styles.shell}
      data-layout={layout}
      data-dragging={dragging || undefined}
      inert={intro.active}
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
        {!isMobile ? (
          <div className={styles.side}>
            <ActivityRail explorerOpen={explorerOpen} onToggleExplorer={toggleExplorer} />
            <AnimatePresence initial={false}>
              {explorerOpen ? (
                <motion.aside
                  key={layout}
                  id="explorer-panel"
                  ref={panelRef}
                  aria-label="Explorer"
                  className={styles.sidebar}
                  initial={isDesktop ? { width: 0 } : { opacity: 0, x: -12 }}
                  animate={isDesktop ? { width: sidebar.width } : { opacity: 1, x: 0 }}
                  exit={isDesktop ? { width: 0 } : { opacity: 0, x: -12 }}
                  transition={{ duration: panelDuration, ease: ease.out }}
                >
                  <div
                    className={styles.sidebarInner}
                    style={isDesktop ? { width: sidebar.width } : undefined}
                  >
                    <Explorer onNavigate={overlayActive ? () => setOverlayOpen(false) : undefined} />
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
          </div>
        ) : (
          <MobileMenu open={overlayActive} meta={meta} onClose={() => setOverlayOpen(false)} />
        )}

        <AnimatePresence>
          {overlayActive && !isMobile ? (
            <motion.div
              key="scrim"
              className={styles.scrim}
              aria-hidden="true"
              onClick={() => closeOverlay(true)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: reduceMotion ? 0 : duration.fast }}
            />
          ) : null}
        </AnimatePresence>

        <main id="main" tabIndex={-1} className={styles.main} inert={overlayActive}>
          <Workspace paused={intro.active} />
        </main>
      </div>

      <StatusBar layout={layout} />
    </div>
  );
}

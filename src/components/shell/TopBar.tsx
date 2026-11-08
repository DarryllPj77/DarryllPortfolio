import type { Ref } from 'react';
import { Link } from 'react-router';
import type { ViewMeta } from '../../data/navigation';
import { profile } from '../../data/profile';
import { getSocial } from '../../data/socials';
import type { LayoutMode } from '../../hooks/useMediaQuery';
import { buttonClass } from '../ui/buttonClass';
import { ExternalLink } from '../ui/ExternalLink';
import { Icon } from '../ui/Icon';
import { ResumeButton } from './ResumeButton';
import styles from './TopBar.module.css';

interface TopBarProps {
  meta: ViewMeta;
  layout: LayoutMode;
  menuOpen: boolean;
  onToggleMenu: () => void;
  menuButtonRef?: Ref<HTMLButtonElement>;
}

export function TopBar({ meta, layout, menuOpen, onToggleMenu, menuButtonRef }: TopBarProps) {
  const github = getSocial('github');
  const linkedin = getSocial('linkedin');
  const isMobile = layout === 'mobile';

  return (
    <header className={styles.topbar}>
      <div className={styles.start}>
        {isMobile ? (
          <button
            ref={menuButtonRef}
            type="button"
            className={buttonClass('ghost', 'icon')}
            aria-expanded={menuOpen}
            aria-controls="explorer-panel"
            aria-label={menuOpen ? 'Close navigation' : 'Open navigation'}
            onClick={onToggleMenu}
          >
            <Icon name={menuOpen ? 'close' : 'menu'} size={20} />
          </button>
        ) : null}
        <Link to="/" className={styles.brand}>
          <span className={styles.mark} aria-hidden="true">
            {profile.initials}
          </span>
          <span className={styles.name}>{profile.fullName}</span>
        </Link>
      </div>

      {!isMobile ? (
        <nav aria-label="Breadcrumb" className={styles.breadcrumb}>
          <ol role="list">
            {meta.crumbs.map((crumb, i) => {
              const isLast = i === meta.crumbs.length - 1;
              return (
                <li key={`${crumb}-${i}`} aria-current={isLast ? 'page' : undefined}>
                  {crumb}
                </li>
              );
            })}
          </ol>
        </nav>
      ) : null}

      <div className={styles.end}>
        {!isMobile ? (
          <>
            <ExternalLink href={github.href} className={buttonClass('ghost', 'icon')} title="GitHub">
              <Icon name="github" size={18} />
              <span className="visually-hidden">GitHub</span>
            </ExternalLink>
            <ExternalLink
              href={linkedin.href}
              className={buttonClass('ghost', 'icon')}
              title="LinkedIn"
            >
              <Icon name="linkedin" size={18} />
              <span className="visually-hidden">LinkedIn</span>
            </ExternalLink>
          </>
        ) : null}
        <ResumeButton size="sm" />
      </div>
    </header>
  );
}

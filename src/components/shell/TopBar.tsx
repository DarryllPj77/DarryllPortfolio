import type { Ref } from 'react';
import { Link } from 'react-router';
import type { ViewMeta } from '../../data/navigation';
import { getSocial } from '../../data/socials';
import type { LayoutMode } from '../../hooks/useMediaQuery';
import { buttonClass } from '../ui/buttonClass';
import { ExternalLink } from '../ui/ExternalLink';
import { Icon } from '../ui/Icon';
import { ResumeButton } from './ResumeButton';
import styles from './TopBar.module.css';
import { TopNav } from './TopNav';

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
            aria-controls="mobile-menu"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            onClick={onToggleMenu}
          >
            <Icon name={menuOpen ? 'close' : 'menu'} size={20} />
          </button>
        ) : null}
        <Link to="/" className={styles.brand} aria-label="darryll.dev, home">
          <span className={styles.mark} aria-hidden="true">
            D
          </span>
          <span className={styles.wordmark} aria-hidden="true">
            darryll<span className={styles.tld}>.dev</span>
          </span>
        </Link>
      </div>

      {!isMobile ? <TopNav meta={meta} /> : null}

      <div className={styles.end}>
        <div className={styles.socials}>
          <ExternalLink href={github.href} className={buttonClass('ghost', 'icon')} title="GitHub">
            <Icon name="github" size={18} />
            <span className="visually-hidden">GitHub</span>
          </ExternalLink>
          <ExternalLink href={linkedin.href} className={buttonClass('ghost', 'icon')} title="LinkedIn">
            <Icon name="linkedin" size={18} />
            <span className="visually-hidden">LinkedIn</span>
          </ExternalLink>
        </div>
        <ResumeButton size="sm" />
      </div>
    </header>
  );
}

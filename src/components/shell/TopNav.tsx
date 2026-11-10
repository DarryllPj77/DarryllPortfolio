import { motion } from 'motion/react';
import { Link } from 'react-router';
import { primaryNav, sections, type ViewMeta } from '../../data/navigation';
import { duration, ease } from '../../motion/tokens';
import styles from './TopBar.module.css';

/** Recruiter-friendly primary navigation with a sliding underline. */
export function TopNav({ meta }: { meta: ViewMeta }) {
  return (
    <nav aria-label="Main" className={styles.nav}>
      <ul role="list" className={styles.navList}>
        {primaryNav.map((id) => {
          const section = sections[id];
          const active = meta.known && meta.section === id;
          const exact = active && meta.path === section.path;
          return (
            <li key={id}>
              <Link
                to={section.path}
                className={styles.navLink}
                aria-current={exact ? 'page' : active ? 'true' : undefined}
                data-companion={section.path}
              >
                {section.label}
                {active ? (
                  <motion.span
                    layoutId="top-nav-indicator"
                    className={styles.indicator}
                    transition={{ duration: duration.base, ease: ease.out }}
                    aria-hidden="true"
                  />
                ) : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

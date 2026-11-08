import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useRef } from 'react';
import { Link } from 'react-router';
import { mobileNav, sections, type ViewMeta } from '../../data/navigation';
import { getSocial } from '../../data/socials';
import { duration, ease, stagger } from '../../motion/tokens';
import { ExternalLink } from '../ui/ExternalLink';
import { Icon } from '../ui/Icon';
import styles from './MobileMenu.module.css';

interface MobileMenuProps {
  open: boolean;
  meta: ViewMeta;
  onClose: () => void;
}

/** Phone navigation: one list with plain labels and the workspace file names. */
export function MobileMenu({ open, meta, onClose }: MobileMenuProps) {
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    if (!open) return;
    const current = listRef.current?.querySelector<HTMLElement>('a[aria-current]');
    (current ?? listRef.current?.querySelector<HTMLElement>('a'))?.focus();
  }, [open]);

  const github = getSocial('github');
  const linkedin = getSocial('linkedin');

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          key="mobile-menu"
          id="mobile-menu"
          className={styles.menu}
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: duration.fast, ease: ease.out }}
        >
          <nav aria-label="Main">
            <motion.ul
              ref={listRef}
              role="list"
              className={styles.list}
              initial="hidden"
              animate="show"
              variants={{ show: { transition: { staggerChildren: stagger.tight } } }}
            >
              {mobileNav.map((id) => {
                const section = sections[id];
                const active = meta.known && meta.section === id;
                return (
                  <motion.li
                    key={id}
                    variants={{ hidden: { opacity: 0, y: 6 }, show: { opacity: 1, y: 0 } }}
                    transition={{ duration: duration.fast, ease: ease.out }}
                  >
                    <Link
                      to={section.path}
                      className={styles.link}
                      aria-current={active ? 'page' : undefined}
                      onClick={onClose}
                    >
                      <span className={styles.index} aria-hidden="true">
                        {section.index}
                      </span>
                      <span className={styles.label}>{section.label}</span>
                      <span className={styles.file} aria-hidden="true">
                        {section.file}
                      </span>
                    </Link>
                  </motion.li>
                );
              })}
            </motion.ul>
          </nav>
          <div className={styles.footer}>
            <ExternalLink href={github.href} className={styles.social}>
              <Icon name="github" size={16} />
              GitHub
            </ExternalLink>
            <ExternalLink href={linkedin.href} className={styles.social}>
              <Icon name="linkedin" size={16} />
              LinkedIn
            </ExternalLink>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

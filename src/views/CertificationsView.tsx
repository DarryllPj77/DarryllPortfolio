import { useEffect } from 'react';
import { useLocation } from 'react-router';
import { Icon } from '../components/ui/Icon';
import { Badge } from '../components/ui/Tag';
import { ViewFrame } from '../components/ui/ViewFrame';
import { certifications, formatMonth, isActive } from '../data/certifications';
import { Reveal } from '../motion/Reveal';
import styles from './Views.module.css';

export function CertificationsView() {
  const { hash } = useLocation();

  // Explorer links such as "Python.cert" point at #<id>: bring that card into view.
  useEffect(() => {
    if (!hash) return;
    const target = document.getElementById(hash.slice(1));
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    target?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
  }, [hash]);

  return (
    <ViewFrame section="certifications" title="Certifications">
      <Reveal as="div">
        <ul role="list" className={styles.certList}>
          {certifications.map((cert) => {
            const active = isActive(cert);
            return (
              <li
                key={cert.id}
                id={cert.id}
                className={styles.cert}
                data-targeted={hash === `#${cert.id}` || undefined}
              >
                <span className={styles.certIcon} aria-hidden="true">
                  <Icon name="award" size={22} />
                </span>
                <div className={styles.certBody}>
                  <p className={styles.certFile} aria-hidden="true">
                    {cert.fileName}
                  </p>
                  <div className={styles.certHeader}>
                    <h2 className={styles.certTitle}>{cert.name}</h2>
                    <Badge tone={active ? 'success' : 'neutral'} dot>
                      {active ? 'Active' : 'Expired'}
                    </Badge>
                  </div>
                  <p className={styles.muted}>{cert.issuer}</p>
                  <dl className={styles.certDates}>
                    <div>
                      <dt>Issued</dt>
                      <dd>{formatMonth(cert.issued)}</dd>
                    </div>
                    <div>
                      <dt>Expires</dt>
                      <dd>{formatMonth(cert.expires)}</dd>
                    </div>
                  </dl>
                </div>
              </li>
            );
          })}
        </ul>
      </Reveal>
    </ViewFrame>
  );
}

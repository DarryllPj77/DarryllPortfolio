import { AnimatePresence } from 'motion/react';
import { useEffect, useState } from 'react';
import { useLocation } from 'react-router';
import { Lightbox } from '../components/projects/Lightbox';
import { buttonClass } from '../components/ui/buttonClass';
import { ExternalLink } from '../components/ui/ExternalLink';
import { Icon } from '../components/ui/Icon';
import { Badge } from '../components/ui/Tag';
import { ViewFrame } from '../components/ui/ViewFrame';
import { certifications, formatDate, isActive } from '../data/certifications';
import { Reveal } from '../motion/Reveal';
import styles from './Views.module.css';

export function CertificationsView() {
  const { hash } = useLocation();
  /** The certificate open in the viewer, or null. */
  const [viewing, setViewing] = useState<string | null>(null);
  const open = certifications.find((c) => c.id === viewing);

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
                    {cert.kind === 'course' ? (
                      <Badge tone="info">Course completion</Badge>
                    ) : active !== null ? (
                      <Badge tone={active ? 'success' : 'neutral'} dot>
                        {active ? 'Active' : 'Expired'}
                      </Badge>
                    ) : null}
                  </div>
                  <p className={styles.muted}>{cert.issuer}</p>
                  <dl className={styles.certDates}>
                    <div>
                      <dt>Issued</dt>
                      <dd>{formatDate(cert.issued)}</dd>
                    </div>
                    {cert.expires ? (
                      <div>
                        <dt>Expires</dt>
                        <dd>{formatDate(cert.expires)}</dd>
                      </div>
                    ) : null}
                    {cert.credentialId ? (
                      <div>
                        <dt>Credential ID</dt>
                        <dd className={styles.certId}>
                          {cert.credentialId}
                          {cert.verifyAt ? (
                            <span className="visually-hidden">, verifiable at {cert.verifyAt}</span>
                          ) : null}
                        </dd>
                      </div>
                    ) : null}
                  </dl>
                  <div className={styles.certActions}>
                    {/* Shown here, in the portfolio's own viewer: no new tab, no download. */}
                    <button
                      type="button"
                      className={buttonClass('ghost', 'sm')}
                      aria-haspopup="dialog"
                      onClick={() => setViewing(cert.id)}
                    >
                      <Icon name="file-text" size={14} />
                      View certificate
                      <span className="visually-hidden">: {cert.name}</span>
                    </button>
                    <ExternalLink href={cert.badgeUrl} className={buttonClass('ghost', 'sm')}>
                      <Icon name="award" size={14} />
                      View badge
                      <span className="visually-hidden">: {cert.name} on Credly</span>
                    </ExternalLink>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </Reveal>

      <AnimatePresence>
        {open ? (
          <Lightbox
            noun="certificate"
            label={open.name}
            shots={[
              {
                ...open.image,
                alt: `${open.name} certificate for Darryll Pajaganas, ${open.issuer}, awarded ${formatDate(open.issued)}`,
                caption: `${open.issuer} · Awarded ${formatDate(open.issued)}${open.credentialId ? ` · Credential ID ${open.credentialId}` : ''}`,
              },
            ]}
            index={0}
            onIndexChange={() => {}}
            onClose={() => setViewing(null)}
          />
        ) : null}
      </AnimatePresence>
    </ViewFrame>
  );
}

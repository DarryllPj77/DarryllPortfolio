import { Icon } from '../components/ui/Icon';
import { Badge } from '../components/ui/Tag';
import { ViewFrame } from '../components/ui/ViewFrame';
import { certifications, formatMonth, isActive } from '../data/certifications';
import styles from './Views.module.css';

export function CertificationsView() {
  return (
    <ViewFrame title="Certifications" path="portfolio/certifications">
      <ul role="list" className={styles.certList}>
        {certifications.map((cert) => {
          const active = isActive(cert);
          return (
            <li key={cert.id} className={styles.cert}>
              <span className={styles.certIcon} aria-hidden="true">
                <Icon name="award" size={22} />
              </span>
              <div className={styles.certBody}>
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
    </ViewFrame>
  );
}

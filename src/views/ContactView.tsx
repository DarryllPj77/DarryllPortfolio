import { useEffect, useRef, useState } from 'react';
import { buttonClass } from '../components/ui/buttonClass';
import { ExternalLink } from '../components/ui/ExternalLink';
import { Icon, type IconName } from '../components/ui/Icon';
import { ViewFrame } from '../components/ui/ViewFrame';
import { profile } from '../data/profile';
import { socials } from '../data/socials';
import styles from './Views.module.css';

type CopyState = 'idle' | 'copied' | 'error';

function CopyEmailButton() {
  const [state, setState] = useState<CopyState>('idle');
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(profile.email);
      setState('copied');
    } catch {
      setState('error');
    }
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setState('idle'), 2500);
  };

  return (
    <>
      <button type="button" className={buttonClass('ghost', 'sm')} onClick={copy}>
        <Icon name={state === 'copied' ? 'check' : 'copy'} size={14} />
        {state === 'copied' ? 'Copied' : 'Copy'}
        <span className="visually-hidden"> email address</span>
      </button>
      <span className="visually-hidden" role="status">
        {state === 'copied' ? 'Email address copied to clipboard' : ''}
        {state === 'error' ? 'Could not copy. Please select the address manually.' : ''}
      </span>
    </>
  );
}

const icons: Record<string, IconName> = { github: 'github', linkedin: 'linkedin', email: 'mail' };

export function ContactView() {
  const email = socials.find((s) => s.id === 'email')!;
  const profiles = socials.filter((s) => s.id !== 'email');

  return (
    <ViewFrame
      title="Contact"
      path="portfolio/contact"
      description={`I'm looking for a ${profile.internship.label} starting ${profile.internship.availability}. Email is the best way to reach me.`}
    >
      <ul role="list" className={styles.contactList}>
        <li className={`${styles.contactItem} ${styles.contactPrimary}`}>
          <span className={styles.contactIcon} aria-hidden="true">
            <Icon name="mail" size={18} />
          </span>
          <div className={styles.contactBody}>
            <span className={styles.contactLabel}>Email</span>
            <a href={email.href} className={styles.contactValue}>
              {email.display}
            </a>
          </div>
          <CopyEmailButton />
        </li>
        {profiles.map((link) => (
          <li key={link.id} className={styles.contactItem}>
            <span className={styles.contactIcon} aria-hidden="true">
              <Icon name={icons[link.id]} size={18} />
            </span>
            <div className={styles.contactBody}>
              <span className={styles.contactLabel}>{link.label}</span>
              <ExternalLink href={link.href} className={styles.contactValue}>
                {link.display}
              </ExternalLink>
            </div>
            <Icon name="external" size={14} className={styles.contactTrail} />
          </li>
        ))}
        <li className={styles.contactItem}>
          <span className={styles.contactIcon} aria-hidden="true">
            <Icon name="map-pin" size={18} />
          </span>
          <div className={styles.contactBody}>
            <span className={styles.contactLabel}>Location</span>
            <span className={styles.contactValue}>{profile.location}</span>
          </div>
        </li>
      </ul>
    </ViewFrame>
  );
}

import { profile } from '../../data/profile';
import { buttonClass, type ButtonSize, type ButtonVariant } from '../ui/buttonClass';
import { ExternalLink } from '../ui/ExternalLink';
import { Icon } from '../ui/Icon';

interface ResumeButtonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

/**
 * Opens the resume PDF when `profile.resumeUrl` is set.
 * Until then it renders as an unavailable button with an explanation.
 */
export function ResumeButton({ variant = 'secondary', size = 'md' }: ResumeButtonProps) {
  if (profile.resumeUrl) {
    return (
      <ExternalLink href={profile.resumeUrl} className={buttonClass(variant, size)}>
        <Icon name="file-text" size={size === 'sm' ? 14 : 16} />
        View Resume
      </ExternalLink>
    );
  }
  return (
    <button
      type="button"
      className={buttonClass(variant, size)}
      aria-disabled="true"
      title="Resume coming soon"
      onClick={(e) => e.preventDefault()}
    >
      <Icon name="file-text" size={size === 'sm' ? 14 : 16} />
      View Resume
      <span className="visually-hidden"> (coming soon)</span>
    </button>
  );
}

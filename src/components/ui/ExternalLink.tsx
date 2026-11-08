import type { AnchorHTMLAttributes, ReactNode } from 'react';

interface ExternalLinkProps extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'target' | 'rel'> {
  href: string;
  children: ReactNode;
}

/** Opens in a new tab and tells assistive tech that it does. */
export function ExternalLink({ href, children, ...rest }: ExternalLinkProps) {
  const isMail = href.startsWith('mailto:');
  return (
    <a
      href={href}
      {...(isMail ? {} : { target: '_blank', rel: 'noopener noreferrer' })}
      {...rest}
    >
      {children}
      {isMail ? null : <span className="visually-hidden"> (opens in a new tab)</span>}
    </a>
  );
}

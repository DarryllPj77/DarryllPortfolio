/**
 * The Gallery's address: `#prematch-tracker` while browsing (that case in front), and
 * `#prematch-tracker/open` with its presentation open. Any view can be linked and reloaded,
 * and the browser's back button closes an open project.
 */
export interface GalleryAddress {
  /** Index of the project named, or null if none (or an unknown one) is. */
  index: number | null;
  open: boolean;
}

export function parseHash(hash: string, slugs: readonly string[]): GalleryAddress {
  const [slug, view] = hash.replace(/^#/, '').split('/');
  const index = slugs.indexOf(slug);
  if (index === -1) return { index: null, open: false };
  return { index, open: view === 'open' };
}

export const formatHash = (slug: string, open: boolean) => `#${slug}${open ? '/open' : ''}`;

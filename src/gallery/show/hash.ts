import type { GalleryCollection } from '../collections';

/**
 * The Gallery's address, after `/gallery`:
 * - `#/` (or nothing): the lobby
 * - `#/3-best-projects`: a collection, its first project in front
 * - `#/3-best-projects/prematch-tracker`: a collection with that project in front
 * - `#/3-best-projects/prematch-tracker/open`: that project's presentation open
 * Every view can be linked and reloaded, and the browser's back button goes up a level.
 * Links from the earlier Gallery (`#prematch-tracker`, `#prematch-tracker/open`) still work:
 * they open the first collection that holds the project.
 */
export type GalleryAddress =
  | { view: 'lobby' }
  | {
      view: 'collection';
      collection: string;
      /** Index of the project in front, within the collection; null for "the first". */
      index: number | null;
      open: boolean;
    };

export const LOBBY: GalleryAddress = { view: 'lobby' };

export function parseHash(hash: string, collections: readonly GalleryCollection[]): GalleryAddress {
  const raw = hash.replace(/^#/, '');
  if (!raw.startsWith('/')) {
    // The earlier Gallery's address: a project slug, maybe "/open".
    const [slug, view] = raw.split('/');
    const home = collections.find((c) => c.projectIds.includes(slug));
    if (!home) return LOBBY;
    return { view: 'collection', collection: home.id, index: home.projectIds.indexOf(slug), open: view === 'open' };
  }
  const [id, slug, view] = raw.slice(1).split('/');
  const collection = collections.find((c) => c.id === id);
  if (!collection) return LOBBY;
  const index = slug ? collection.projectIds.indexOf(slug) : -1;
  if (index === -1) return { view: 'collection', collection: id, index: null, open: false };
  return { view: 'collection', collection: id, index, open: view === 'open' };
}

/** The address of the lobby, a collection, or a project in it (open or not). */
export function formatHash(collection?: string, slug?: string, open = false): string {
  if (!collection) return '#/';
  if (!slug) return `#/${collection}`;
  return `#/${collection}/${slug}${open ? '/open' : ''}`;
}

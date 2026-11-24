import { getExhibit, type GalleryProject } from './data';

/*
 * The Gallery's collections: the exhibitions shown in its lobby. A collection is only data:
 * which projects it holds, in what order, how it looks, and which presentation shows it.
 * Adding one is a new entry here (and a new presentation only if it needs a new layout).
 * A project can appear in several collections; its exhibit (screenshots, crop, technologies)
 * is defined once, in data.ts.
 */

/**
 * How a collection is shown. "hex-carousel": its projects as hexagonal display cases on a 3D
 * ring turning side to side, the front one large, the others receding behind it. New layouts
 * are added to this list and to the presentation registry (presentations.ts).
 */
export type PresentationType = 'hex-carousel';

export interface CollectionTheme {
  /** The lit edge of the case in front, and the collection's accents in the lobby. */
  accent: string;
  /** The colour of the exhibit light. */
  light: string;
}

export interface GalleryCollection {
  /** Used in the address: /gallery#/<id>. */
  id: string;
  name: string;
  theme: CollectionTheme;
  /** Project slugs (see data.ts), in the order the collection shows them. */
  projectIds: string[];
  presentation: PresentationType;
}

/** The collections the lobby shows, in order. Only real, filled collections belong here. */
export const collections: GalleryCollection[] = [
  {
    id: '3-best-projects',
    name: 'My 3 Best Projects',
    theme: { accent: '#818cf8', light: '#fff4e6' },
    projectIds: ['academic-sentinel', 'prematch-tracker', 'spendsync'],
    presentation: 'hex-carousel',
  },
  {
    id: 'learning-academic-tools',
    name: 'Learning & Academic Tools',
    theme: { accent: '#38bdf8', light: '#eef8ff' },
    projectIds: ['quizer', 'academic-sentinel'],
    presentation: 'hex-carousel',
  },
];

export function getCollection(id: string): GalleryCollection | undefined {
  return collections.find((c) => c.id === id);
}

/** A collection's exhibits, in its own order. */
export const exhibitsIn = (collection: GalleryCollection): GalleryProject[] => collection.projectIds.map(getExhibit);

/** "Collection 01": a collection's place in the lobby. */
export const collectionNumber = (collection: GalleryCollection) =>
  `Collection ${String(collections.indexOf(collection) + 1).padStart(2, '0')}`;

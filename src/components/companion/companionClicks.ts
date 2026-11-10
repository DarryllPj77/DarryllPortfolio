/**
 * Decides what a click means to the workspace companion:
 * - a click on (or inside) an element marked `data-companion` sends it there to talk;
 * - a click on empty space in the workspace sends it to that spot;
 * - anything else (links, buttons, form fields, selected text, dialogs) is ignored.
 */
export type CompanionClick =
  | { kind: 'target'; key: string; element: Element }
  | { kind: 'roam'; x: number; y: number };

/** Things a click should do something with on its own: never "empty space". */
const INTERACTIVE = [
  'a[href]',
  'button',
  'input',
  'select',
  'textarea',
  'label',
  'summary',
  'video',
  '[role="button"]',
  '[role="link"]',
  '[role="tab"]',
  '[contenteditable="true"]',
  '[data-companion-ignore]',
].join(',');

export function classifyClick(
  event: Pick<MouseEvent, 'button' | 'ctrlKey' | 'metaKey' | 'shiftKey' | 'altKey' | 'clientX' | 'clientY' | 'target'>,
  roamArea: Element | null,
  selection: Selection | null = window.getSelection(),
): CompanionClick | null {
  if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return null;
  const el = event.target;
  if (!(el instanceof Element)) return null;

  const target = el.closest('[data-companion]');
  if (target) {
    const key = target.getAttribute('data-companion');
    return key ? { kind: 'target', key, element: target } : null;
  }

  if (!roamArea?.contains(el)) return null;
  if (el.closest(INTERACTIVE) || el.closest('[role="dialog"]')) return null;
  // The visitor was selecting text, not pointing somewhere.
  if (selection && !selection.isCollapsed) return null;
  return { kind: 'roam', x: event.clientX, y: event.clientY };
}

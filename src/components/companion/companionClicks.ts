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

/**
 * A right-click that should send the avatar travelling: a mouse or pen click inside the
 * workspace (the page content, the Explorer, or on the avatar itself). Everything else keeps
 * the browser's own menu: touch (a long press fires `contextmenu` too), Shift + right-click,
 * text fields, selected text, and anything outside the workspace (top bar, status bar).
 */
export function travelDestination(
  event: Pick<MouseEvent, 'clientX' | 'clientY' | 'shiftKey' | 'target'> & { pointerType?: string },
  isAvatar: (el: Element) => boolean,
  selection: Selection | null = window.getSelection(),
): { x: number; y: number } | null {
  if (event.pointerType === 'touch' || event.shiftKey) return null;
  const t = event.target;
  if (!(t instanceof Element)) return null;
  if (t.closest('#main, #explorer-panel') === null && !isAvatar(t)) return null;
  if (t.closest('input, textarea, select, [contenteditable="true"]')) return null;
  if (selection && !selection.isCollapsed) return null;
  return { x: event.clientX, y: event.clientY };
}

/** A tap is lifted within this time; longer is a hold (the avatar's hold-to-pick-up is 300ms). */
export const TAP_MAX_MS = 280;
/** A tap moves less than this (px); more is the start of a scroll or a swipe. */
export const TAP_SLOP = 10;

export interface TouchDown {
  x: number;
  y: number;
  /** performance.now() at the press. */
  t: number;
  scrollX: number;
  scrollY: number;
}

export interface TouchUp extends TouchDown {
  target: EventTarget | null;
  pointerType: string;
}

/**
 * A finger tap that should send the avatar travelling to the tapped spot: a quick, still,
 * single touch on empty space in the workspace. Not a hold (that is the avatar's pick-up),
 * not a swipe or scroll (the finger moved, or the page scrolled), and not a tap on anything
 * with its own job: links, buttons, fields, menus, dialogs, the avatar or its speech line.
 */
export function tapDestination(
  down: TouchDown,
  up: TouchUp,
  isAvatarOrLine: (el: Element) => boolean,
  selection: Selection | null = window.getSelection(),
): { x: number; y: number } | null {
  if (up.pointerType !== 'touch') return null;
  if (up.t - down.t > TAP_MAX_MS) return null;
  if (Math.hypot(up.x - down.x, up.y - down.y) > TAP_SLOP) return null;
  if (up.scrollX !== down.scrollX || up.scrollY !== down.scrollY) return null;
  const t = up.target;
  if (!(t instanceof Element)) return null;
  if (isAvatarOrLine(t)) return null;
  if (t.closest('#main, #explorer-panel') === null) return null;
  if (t.closest(INTERACTIVE) || t.closest('[role="dialog"]')) return null;
  if (selection && !selection.isCollapsed) return null;
  return { x: up.x, y: up.y };
}

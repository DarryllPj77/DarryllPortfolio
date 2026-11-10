/**
 * The design-taste-frontend kit (public/assets) runs as plain scripts that read the page once when
 * they load: nav menus and the phone sheet (system.js), the hover and press layer and the hero's
 * entrance (motion.js), the hero's small moments (layout.js), diagram cards (diagrams/mount.js) and
 * the dealt moment (loaded by system.js). React renders the page first, then these are added, so they
 * always see the finished markup. Pages link to each other with full page loads for the same reason.
 */
const KIT_SCRIPTS = [
  '/assets/system.js',
  '/assets/motion/motion.js',
  '/assets/layout/layout.js',
  '/assets/diagrams/mount.js',
];

export function loadKit(doc: Document = document) {
  for (const src of KIT_SCRIPTS) {
    if (doc.querySelector(`script[src="${src}"]`)) continue;
    const script = doc.createElement('script');
    script.type = 'module';
    script.src = src;
    doc.body.appendChild(script);
  }
}

/** Old routes from the previous site, sent to the section that now holds their content. */
export const legacyRedirects: Record<string, string> = {
  '/projects': '/#work',
  '/about': '/#about',
  '/skills': '/#skills',
  '/certifications': '/#about',
  '/contact': '/#contact',
  '/projects/prematch-tracker': '/#projects',
  '/projects/spendsync': '/#projects',
};

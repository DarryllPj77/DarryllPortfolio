import { StrictMode } from 'react';
import { flushSync } from 'react-dom';
import { createRoot } from 'react-dom/client';
import App from './App';
import { legacyRedirects, loadKit } from './kit';
import './site/site.css';

// "/index.html" is the home page too (a static server or the skill's checkers load it by name).
const path = window.location.pathname.replace(/\/index\.html$/, '/').replace(/\/+$/, '') || '/';
const redirect = legacyRedirects[path];

if (redirect) {
  window.location.replace(redirect);
} else {
  const root = createRoot(document.getElementById('root')!);
  // Render synchronously so the kit scripts find the finished page when they run.
  flushSync(() =>
    root.render(
      <StrictMode>
        <App path={path} />
      </StrictMode>,
    ),
  );
  loadKit();
}

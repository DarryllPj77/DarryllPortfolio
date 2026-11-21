import '@fontsource-variable/fraunces';
import '@fontsource-variable/inter';
import '@fontsource-variable/jetbrains-mono';
import '../styles/tokens.css';
import './gallery.css';

import { Analytics } from '@vercel/analytics/react';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { GalleryApp } from './GalleryApp';

createRoot(document.getElementById('gallery-root')!).render(
  <StrictMode>
    <GalleryApp />
    {/* Vercel Web Analytics for the Gallery page too (it is a separate HTML entry). */}
    <Analytics />
  </StrictMode>,
);

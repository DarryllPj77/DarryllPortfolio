import '@fontsource-variable/fraunces';
import '@fontsource-variable/inter';
import '@fontsource-variable/jetbrains-mono';
import '../styles/tokens.css';
import './gallery.css';

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { GalleryApp } from './GalleryApp';

createRoot(document.getElementById('gallery-root')!).render(
  <StrictMode>
    <GalleryApp />
  </StrictMode>,
);

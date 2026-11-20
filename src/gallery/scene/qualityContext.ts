import { createContext, useContext } from 'react';
import type { Quality } from './quality';

/** The canvas's current quality setting, for every scene drawn in it. */
export const QualityContext = createContext<Quality>('high');

export const useQuality = () => useContext(QualityContext);

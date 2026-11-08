import { useState } from 'react';
import { avatarConfig, LOW_MEMORY_GB, type AvatarMode } from '../components/3d/avatar.config';

interface NavigatorHints {
  connection?: { saveData?: boolean };
  deviceMemory?: number;
}

function supportsWebGL2(): boolean {
  try {
    const gl = document.createElement('canvas').getContext('webgl2');
    // Release the test context straight away: browsers cap live WebGL contexts.
    gl?.getExtension('WEBGL_lose_context')?.loseContext();
    return Boolean(gl);
  } catch {
    return false;
  }
}

/**
 * Decides once, on mount, whether this visitor gets the 3D scene or the still
 * poster. The poster is used when the scene is switched off or has no model,
 * when WebGL2 is missing, when data saver is on, or on low-memory devices.
 * Reduced motion does not force the poster: the scene can render a still pose.
 */
export function detectAvatarMode(): AvatarMode {
  if (avatarConfig.mode !== 'scene' || !avatarConfig.modelUrl) return 'poster';
  const hints = navigator as Navigator & NavigatorHints;
  if (hints.connection?.saveData) return 'poster';
  if (hints.deviceMemory !== undefined && hints.deviceMemory <= LOW_MEMORY_GB) return 'poster';
  if (!supportsWebGL2()) return 'poster';
  return 'scene';
}

export function useAvatarCapability(): AvatarMode {
  const [mode] = useState(detectAvatarMode);
  return mode;
}

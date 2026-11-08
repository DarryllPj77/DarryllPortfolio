import { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  /** Lets the slot drop the scene and its controls, leaving the fallback. */
  onError?: () => void;
}

/**
 * If the 3D scene fails (no WebGL context, model fails to load), render
 * nothing: the fallback underneath stays visible and no error is shown.
 */
export class AvatarErrorBoundary extends Component<Props, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    if (import.meta.env.DEV) console.warn('Avatar scene failed; showing the fallback.', error);
    this.props.onError?.();
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}

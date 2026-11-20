import { Component, type ReactNode } from 'react';

interface Props {
  /** Called once if anything in the 3D scene fails (a screenshot that will not load, for instance). */
  onError: (error: unknown) => void;
  children: ReactNode;
}

/**
 * Catches a failure inside the 3D scene so it never blanks the page: the Gallery shows its
 * HTML exhibition instead, with the same projects and links.
 */
export class SceneErrorBoundary extends Component<Props, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    this.props.onError(error);
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}

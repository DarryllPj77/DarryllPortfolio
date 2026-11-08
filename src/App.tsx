import { MotionConfig } from 'motion/react';
import { AppShell } from './components/shell/AppShell';

export default function App() {
  return (
    <MotionConfig reducedMotion="user">
      <AppShell />
    </MotionConfig>
  );
}

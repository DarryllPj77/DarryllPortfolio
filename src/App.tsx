import { MotionConfig } from 'motion/react';
import { AppShell } from './components/shell/AppShell';
import { IntroOverlay } from './intro/IntroOverlay';
import { IntroProvider } from './intro/IntroProvider';

export default function App() {
  return (
    <MotionConfig reducedMotion="user">
      <IntroProvider>
        <AppShell />
        <IntroOverlay />
      </IntroProvider>
    </MotionConfig>
  );
}

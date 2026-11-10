import { MotionConfig } from 'motion/react';
import { CompanionProvider } from './components/companion/CompanionProvider';
import { AppShell } from './components/shell/AppShell';
import { IntroOverlay } from './intro/IntroOverlay';
import { IntroProvider } from './intro/IntroProvider';

export default function App() {
  return (
    <MotionConfig reducedMotion="user">
      <IntroProvider>
        <CompanionProvider>
          <AppShell />
        </CompanionProvider>
        <IntroOverlay />
      </IntroProvider>
    </MotionConfig>
  );
}

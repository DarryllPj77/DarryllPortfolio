import { Link } from 'react-router';
import { buttonClass } from '../components/ui/buttonClass';
import { Icon } from '../components/ui/Icon';
import { ViewFrame } from '../components/ui/ViewFrame';
import { Reveal } from '../motion/Reveal';
import styles from './Views.module.css';

export function NotFoundView() {
  return (
    <ViewFrame
      section="home"
      title="Page not found"
      marker={{ index: '404', label: 'Missing file' }}
      description="That file doesn't exist in this workspace. It may have been moved or renamed."
    >
      <Reveal className={styles.linksRow}>
        <Link to="/" className={buttonClass('primary')}>
          <Icon name="home" size={16} />
          Back to home
        </Link>
        <Link to="/projects" className={buttonClass('secondary')}>
          View projects
        </Link>
      </Reveal>
    </ViewFrame>
  );
}

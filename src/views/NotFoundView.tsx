import { Link } from 'react-router';
import { buttonClass } from '../components/ui/buttonClass';
import { Icon } from '../components/ui/Icon';
import { ViewFrame } from '../components/ui/ViewFrame';
import styles from './Views.module.css';

export function NotFoundView() {
  return (
    <ViewFrame
      title="Page not found"
      path="portfolio/404"
      description="That file doesn't exist in this workspace. It may have been moved or renamed."
    >
      <div className={styles.linksRow}>
        <Link to="/" className={buttonClass('primary')}>
          <Icon name="home" size={16} />
          Back to home
        </Link>
        <Link to="/projects" className={buttonClass('secondary')}>
          View projects
        </Link>
      </div>
    </ViewFrame>
  );
}

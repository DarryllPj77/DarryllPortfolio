import { Exhibit } from '../components/gallery/Exhibit';
import { ViewFrame } from '../components/ui/ViewFrame';
import { exhibits } from '../data/gallery';
import styles from './GalleryView.module.css';

/** The Gallery: real screens from each project. The Projects page holds the information. */
export function GalleryView() {
  const total = String(exhibits.length).padStart(2, '0');
  return (
    <ViewFrame
      section="gallery"
      title="Gallery"
      description="Real screens from each project. Open one to read how it was built."
    >
      <div className={styles.hall}>
        <ol role="list" className={styles.wall}>
          {exhibits.map((exhibit, i) => (
            <Exhibit
              key={exhibit.project.slug}
              exhibit={exhibit}
              number={`${String(i + 1).padStart(2, '0')} / ${total}`}
            />
          ))}
        </ol>
      </div>
    </ViewFrame>
  );
}

import { FeaturedProject } from '../components/projects/FeaturedProject';
import { ProjectCard } from '../components/projects/ProjectCard';
import projectStyles from '../components/projects/Projects.module.css';
import { SectionTitle, ViewFrame } from '../components/ui/ViewFrame';
import { featuredProject, projects } from '../data/projects';
import styles from './Views.module.css';

export function ProjectsView() {
  const others = projects.filter((p) => p.slug !== featuredProject.slug);
  return (
    <ViewFrame
      title="Projects"
      path="portfolio/projects"
      description="Each project lists what I did myself and where AI coding tools did the implementation work."
    >
      <div className={styles.stack}>
        <FeaturedProject project={featuredProject} />
        <section aria-labelledby="more-projects">
          <SectionTitle id="more-projects">More projects</SectionTitle>
          <div className={projectStyles.grid}>
            {others.map((project) => (
              <ProjectCard key={project.slug} project={project} />
            ))}
          </div>
        </section>
      </div>
    </ViewFrame>
  );
}

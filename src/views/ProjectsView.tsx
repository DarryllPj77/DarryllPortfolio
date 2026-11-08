import { ProjectIndex } from '../components/projects/ProjectIndex';
import { ViewFrame } from '../components/ui/ViewFrame';

export function ProjectsView() {
  return (
    <ViewFrame
      section="projects"
      title="Projects"
      description="Three case studies. Each one states what I did myself and where AI coding tools did the implementation work."
    >
      <ProjectIndex />
    </ViewFrame>
  );
}

import { getProject } from './data/projects';
import { CaseStudyPage } from './site/CaseStudyPage';
import { HomePage } from './site/HomePage';
import { NotFoundPage } from './site/NotFoundPage';

/** Three kinds of page, chosen by path. Links between them are full page loads (see kit.ts). */
export default function App({ path }: { path: string }) {
  if (path === '/') return <HomePage />;

  const caseStudy = /^\/projects\/([\w-]+)$/.exec(path);
  const project = caseStudy ? getProject(caseStudy[1]) : undefined;
  if (project?.chapters) return <CaseStudyPage project={project} />;

  return <NotFoundPage />;
}

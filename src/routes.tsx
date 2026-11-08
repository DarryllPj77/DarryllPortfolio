import { Route, Routes, type Location } from 'react-router';
import { AboutView } from './views/AboutView';
import { CertificationsView } from './views/CertificationsView';
import { ContactView } from './views/ContactView';
import { HomeView } from './views/HomeView';
import { NotFoundView } from './views/NotFoundView';
import { ProjectDetailView } from './views/ProjectDetailView';
import { ProjectsView } from './views/ProjectsView';
import { SkillsView } from './views/SkillsView';

export function AppRoutes({ location }: { location: Location }) {
  return (
    <Routes location={location}>
      <Route index element={<HomeView />} />
      <Route path="about" element={<AboutView />} />
      <Route path="projects" element={<ProjectsView />} />
      <Route path="projects/:slug" element={<ProjectDetailView />} />
      <Route path="skills" element={<SkillsView />} />
      <Route path="certifications" element={<CertificationsView />} />
      <Route path="contact" element={<ContactView />} />
      <Route path="*" element={<NotFoundView />} />
    </Routes>
  );
}

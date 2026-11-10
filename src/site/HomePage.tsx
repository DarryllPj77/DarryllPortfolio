import type { CSSProperties } from 'react';
import { AvatarSlot } from '../components/3d/AvatarSlot';
import { certifications, formatMonth } from '../data/certifications';
import { profile } from '../data/profile';
import { getProject } from '../data/projects';
import { skillGroups } from '../data/skills';
import { ActionBar } from './ActionBar';
import { Arrow } from './Arrow';
import { Closing } from './Closing';
import { contactHref, MAIN_ACTION } from './links';
import { Nav } from './Nav';

const SHOTS = '/image/projects/academic-sentinel';

/** Hero, dealt `centred`: the pill, the h1 with the mark, the lead, two buttons, then one window. */
function Hero() {
  const { internship } = profile;
  return (
    <section className="hero hero--centred bg-field" data-enter aria-labelledby="hero-h">
      <div className="wrap">
        <div className="hero-text">
          <div className="hero__c">
            <a className="pill" href="#about">
              <span>Open to a {internship.label}</span>
              <span className="muted">Dec 2026</span>
            </a>
            <h1 id="hero-h" aria-label="C# and .NET developer in Antipolo">
              <svg className="hero__mark" viewBox="0 0 24 24" aria-hidden="true"><circle cx="6.5" cy="6.5" r="4.5" /><circle cx="17.5" cy="6.5" r="4.5" /><circle cx="6.5" cy="17.5" r="4.5" /><rect x="13" y="13" width="9" height="9" rx="1.5" /></svg>{' '}C# and .NET developer
              in Antipolo
            </h1>
            <p className="hero__lead">
              Fourth-year Computer Science student at {profile.school}, building WPF desktop apps
              and ASP.NET Core APIs with PostgreSQL.
            </p>
            <div className="btn-row">
              <a className="btn btn--primary" href={contactHref}>
                {MAIN_ACTION}
                <Arrow />
              </a>
              <a className="btn btn--secondary" href="#work">
                See my projects
              </a>
            </div>
          </div>
          <div
            className="hero__window"
            role="img"
            aria-label="Academic Sentinel's instructor console during a live exam, listing window switches and clipboard use as they happen"
          >
            <div className="ly-piece hero__shot" aria-hidden="true">
              <img
                src={`${SHOTS}/teacher-live-monitoring.jpg`}
                alt=""
                width={1125}
                height={653}
                fetchPriority="high"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/** split-text-left: Academic Sentinel beside its session setup screen, cut by the frame. */
function Work() {
  const project = getProject('academic-sentinel')!;
  return (
    <section className="section g2m" id="work" aria-labelledby="work-h">
      <div className="wrap grid">
        <>
          <div className="span-5 split-col">
            <h2 id="work-h">Academic Sentinel, an exam monitoring app</h2>
            <p className="t-lead">
              A WPF desktop client and an ASP.NET Core API that watch an exam session live. Teachers
              see window switches, clipboard use and unauthorized apps as they happen, then each
              student&rsquo;s risk level.
            </p>
            <ul className="work__facts">
              <li>Team project, {project.period.replace('–', ' to ')}, C# on .NET 10 with SignalR and PostgreSQL.</li>
              <li>I worked on the UI, UI testing, bug fixing and backend logic.</li>
              <li>AI coding tools wrote other parts, directed by my research.</li>
            </ul>
            <p>
              <a className="link" href={`/projects/${project.slug}`}>
                Read the case study
              </a>
            </p>
          </div>
          <div className="frame frame--split span-6 start-7">
            <div className="stage stage--fade-br">
              <img
                className="at-corner work__shot"
                src={`${SHOTS}/teacher-session-setup.jpg`}
                alt="Academic Sentinel's session setup: the exam type, the LMS exam URL students must stay on, and the detection rules"
                width={923}
                height={571}
                loading="lazy"
              />
            </div>
          </div>
        </>
      </div>
    </section>
  );
}

const SPENDSYNC_DIAGRAM = JSON.stringify({
  layout: 'hub',
  alt: 'SpendSync reads spreadsheets with SheetJS, charts them with Chart.js, and saves to Google Drive and the browser.',
  center: { label: 'SpendSync', icon: 'text:SS' },
  spokes: [
    { label: 'SheetJS', icon: 'ui:sheet' },
    { label: 'Chart.js', icon: 'chartjs' },
    { label: 'Google Drive', icon: 'google-drive' },
    { label: 'localStorage', icon: 'ui:hard-drive' },
  ],
});

/** features, one row of two open cards: each project's own picture in its panel. */
function Projects() {
  const prematch = getProject('prematch-tracker')!;
  const spendsync = getProject('spendsync')!;
  const live = prematch.links.find((l) => l.kind === 'live')!;
  const spendRepo = spendsync.links.find((l) => l.kind === 'repo')!;
  return (
    <section className="section" id="projects" style={{ '--hm': 2 } as CSSProperties} aria-labelledby="projects-h">
      <div className="wrap">
        <div className="section-head">
          <h2 id="projects-h">
            Two web apps, built with AI tools.{' '}
            <span className="muted">I wrote the concept, researched the stack and tested each version.</span>
          </h2>
        </div>
        <div className="grid">
          <article className="card card--row card--open span-6">
            <h3>
              <a href={live.href}>Tracks a team&rsquo;s practice and attendance</a>
            </h3>
            <p>
              {prematch.name}: players log practice, a manager reviews attendance. React, Express,
              Socket.IO and PostgreSQL on Neon.
            </p>
            <div className="panel">
              <img
                className="frame__img"
                src="/image/projects/prematch-tracker/prematch-login-800.jpg"
                srcSet="/image/projects/prematch-tracker/prematch-login-800.jpg 800w, /image/projects/prematch-tracker/prematch-login.png 1440w"
                sizes="(min-width: 1024px) 50vw, (min-width: 640px) 90vw, 100vw"
                alt="PreMatch Tracker's sign-in screen, with a callsign and a four-digit PIN"
                width={1440}
                height={900}
                loading="lazy"
              />
            </div>
          </article>
          <article className="card card--row card--open span-6">
            <h3>
              <a href={spendRepo.href}>Tracks spending from spreadsheets</a>
            </h3>
            <p>
              {spendsync.name} reads spreadsheets with SheetJS, charts spending with Chart.js and saves
              to Google Drive.
            </p>
            <div className="panel">
              <div className="dg" data-diagram={SPENDSYNC_DIAGRAM}></div>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}

/** The dark band, with the dealt moment line-carries-colour: who I am, the 3D avatar beside it. */
function About() {
  const { internship } = profile;
  return (
    <section
      className="section ground-inverse g2m"
      id="about"
      data-moment="line-carries-colour"
      data-moment-opts='{"from": "base"}'
      aria-labelledby="about-h"
    >
      <div className="wrap grid">
        <>
          <div className="span-5 split-col">
            <h2 id="about-h">
              About me. <span className="muted">I am a fourth-year {profile.specialization} student looking for a .NET team.</span>
            </h2>
            <p>
              My projects start with a problem. I research how the parts fit, plan the features,
              build the UI and backend logic, then test each version. I use Claude Code and Codex in
              that workflow and say where they wrote the code.
            </p>
            <ul className="rows">
              <li>
                <span className="rows__name">{internship.label}</span>
                <p>{internship.availability}, subject to my academic schedule</p>
              </li>
              {certifications.map((cert) => (
                <li key={cert.id}>
                  <span className="rows__name">{cert.name}</span>
                  <p>
                    {cert.issuer}, {formatMonth(cert.issued)} to {formatMonth(cert.expires)}
                  </p>
                </li>
              ))}
            </ul>
          </div>
          <figure className="span-6 start-7 about__avatar">
            <AvatarSlot />
          </figure>
        </>
      </div>
    </section>
  );
}

const STACK_DIAGRAM = JSON.stringify({
  layout: 'hub',
  alt: 'My main stack: .NET at the centre, with C#, PostgreSQL, Visual Studio, Git, NuGet and Swagger around it.',
  center: { label: '.NET', icon: 'dotnet' },
  spokes: [
    { label: 'C#', icon: 'c-sharp' },
    { label: 'PostgreSQL', icon: 'postgres' },
    { label: 'Visual Studio', icon: 'visual-studio' },
    { label: 'Git', icon: 'git-icon' },
    { label: 'NuGet', icon: 'nuget-icon' },
    { label: 'Swagger', icon: 'swagger' },
  ],
});

/**
 * The integrations section: the main stack as a hub diagram card beside the heading, then every
 * language and tool by its real icon, in groups that say how much I have used each.
 */
function Skills() {
  return (
    <section className="section bg-mist" id="skills" aria-labelledby="skills-h">
      <div className="wrap grid">
        <div className="grid span-12 skills__head">
          <div className="span-5 split-col">
            <h2 id="skills-h">
              Languages and tools. <span className="muted">Grouped by how much I have used them.</span>
            </h2>
          </div>
          <div className="panel skills__stack span-6 start-7">
            <div className="dg" data-diagram={STACK_DIAGRAM}></div>
          </div>
        </div>
        <ul className="skills__grid span-12">
          {skillGroups.map((group) => (
            <li className="skills__group" key={group.id}>
              <p className="t-label">{group.title}</p>
              <ul className="skills__items" aria-label={group.title}>
                {group.items.map((item) => (
                  <li key={item.name}>
                    {item.icon ? (
                      <img className="ic" src={`/assets/icons/${item.icon}`} alt="" width={18} height={18} />
                    ) : null}
                    {item.name}
                    {item.qualifier ? <span className="muted"> ({item.qualifier})</span> : null}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function HomePage() {
  return (
    <>
      <Nav home />
      <main id="top">
        <Hero />
        <Work />
        <Projects />
        <About />
        <Skills />
      </main>
      <Closing home />
      <ActionBar />
    </>
  );
}

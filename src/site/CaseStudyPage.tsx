import type { CSSProperties } from 'react';
import type { Project } from '../data/types';
import { Arrow } from './Arrow';
import { ActionBar } from './ActionBar';
import { Closing } from './Closing';
import { Nav } from './Nav';
import { ShotGrid } from './ShotGrid';

/** A section's height in screens (layout-v4.md): larger screenshot groups take two at desktop. */
const screens = (shotCount: number) => ({ '--h': shotCount > 3 ? 2 : 1, '--hm': shotCount > 4 ? 2 : 1 }) as CSSProperties;

/**
 * The long copy of the portfolio's main project, on a sub-page of its own (copy.md: long copy goes
 * to sub-pages), built from the same system: one idea per section, the h2 first.
 */
export function CaseStudyPage({ project }: { project: Project }) {
  const repo = project.links.find((l) => l.kind === 'repo');
  const chapters = project.chapters ?? [];
  const hero = project.hero;

  return (
    <>
      <Nav home={false} />
      <main id="top">
        <section className="hero hero--case" data-enter aria-labelledby="case-h">
          <div className="wrap">
            <div className="hero-text grid">
              <div className="span-5 split-col">
                <p className="t-label muted">Case study, {project.period.replace('–', ' to ')}</p>
                <h1 id="case-h">{project.name}, an exam monitoring app</h1>
                <p className="t-lead">{project.summary}</p>
                <div className="btn-row">
                  {repo ? (
                    <a className="btn btn--primary" href={repo.href}>
                      See the code on GitHub
                      <Arrow />
                    </a>
                  ) : null}
                  <a className="btn btn--secondary" href="/#work">
                    See all projects
                  </a>
                </div>
              </div>
              {hero ? (
                <div className="frame case__hero span-6 start-7">
                  <img src={hero.src} alt={hero.alt} width={hero.width} height={hero.height} fetchPriority="high" />
                </div>
              ) : null}
            </div>
          </div>
        </section>

        <section className="section" id="part" aria-labelledby="part-h">
          <div className="wrap">
            <div className="grid">
              <div className="span-5 split-col">
                <h2 id="part-h">My part in {project.name}</h2>
                <p>{project.credit.note}</p>
              </div>
              <ul className="rows span-6 start-7">
                {project.contributions.map((item) => (
                  <li key={item}>
                    <span className="rows__name">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {project.features?.length ? (
          <section className="section" id="features" aria-labelledby="features-h">
            <div className="wrap">
              <div className="grid">
                <div className="span-5 split-col">
                  <h2 id="features-h">What {project.name} does</h2>
                </div>
                <ul className="rows span-6 start-7">
                  {project.features.map((item) => (
                    <li key={item}>
                      <p>{item}</p>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>
        ) : null}

        {chapters.map((chapter) => {
          const shots = chapter.blocks.flatMap((b) => b.shots);
          return (
            <section className="section" id={chapter.id} key={chapter.id} style={screens(shots.length)} aria-labelledby={`${chapter.id}-h`}>
              <div className="wrap">
                <div className="section-head">
                  <h2 id={`${chapter.id}-h`}>{chapter.title}</h2>
                  <p>{chapter.intro}</p>
                </div>
                <ShotGrid shots={shots} label={chapter.title} />
              </div>
            </section>
          );
        })}

        {project.architecture ? (
          <section className="section" id="stack" aria-labelledby="stack-h">
            <div className="wrap">
              <div className="grid">
                <div className="span-5 split-col">
                  <h2 id="stack-h">How {project.name} is built</h2>
                  <p>{project.architecture.realtime?.detail}, over {project.architecture.realtime?.label}.</p>
                </div>
                <ul className="rows span-6 start-7">
                  {project.architecture.nodes.map((node) => (
                    <li key={node.label}>
                      <span className="rows__name">{node.label}</span>
                      {node.detail ? <p>{node.detail}</p> : null}
                    </li>
                  ))}
                  <li>
                    <span className="rows__name">Also in the stack</span>
                    <p>{project.stack.join(', ')}</p>
                  </li>
                </ul>
              </div>
            </div>
          </section>
        ) : null}
      </main>
      <Closing home={false} />
      <ActionBar />
    </>
  );
}

import { ActionBar } from './ActionBar';
import { Closing } from './Closing';
import { Nav } from './Nav';

/** Any path the site does not have. */
export function NotFoundPage() {
  return (
    <>
      <Nav home={false} />
      <main id="top">
        <section className="hero hero--case" data-enter aria-labelledby="nf-h">
          <div className="wrap">
            <div className="hero-text">
              <div className="split-col">
                <p className="t-label muted">404</p>
                <h1 id="nf-h">This page is not on the portfolio</h1>
                <p className="t-lead">The link may be from an older version of the site.</p>
                <div className="btn-row">
                  <a className="btn btn--primary" href="/">
                    Go to the home page
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Closing home={false} />
      <ActionBar />
    </>
  );
}

import Link from "next/link";

export default function Home() {
  return (
    <div className="landing-wrap">
      <main className="hero-card">
        <div className="hero-grid">
          <section>
            <span className="hero-kicker">Marketplace Frontend</span>
            <h1 className="hero-title">Pitch faster. Match better. Deliver confidently.</h1>
            <p className="hero-subtitle">
              SkillBridge connects clients and freelancers through jobs, proposals, contracts, milestones, and
              notifications. Log in and run the full end-to-end workflow from one polished interface.
            </p>

            <div className="hero-actions">
              <Link href="/login" className="btn-primary">
                Login
              </Link>
              <Link href="/register" className="btn-secondary">
                Create account
              </Link>
              <Link href="/jobs" className="btn-secondary">
                Explore jobs
              </Link>
            </div>
          </section>

          <aside className="hero-panel">
            <h2>Demo snapshot</h2>
            <p>Pre-wired flows for both CLIENT and FREELANCER journeys.</p>
            <div className="hero-stats">
              <article className="hero-stat">
                <p className="hero-stat-label">Modules</p>
                <p className="hero-stat-value">6</p>
              </article>
              <article className="hero-stat">
                <p className="hero-stat-label">Roles</p>
                <p className="hero-stat-value">2</p>
              </article>
              <article className="hero-stat">
                <p className="hero-stat-label">Core APIs</p>
                <p className="hero-stat-value">12</p>
              </article>
            </div>
            <ul className="hero-list">
              <li>Role-based dashboard routing after login</li>
              <li>Job create/search/detail/apply workflow</li>
              <li>Proposal acceptance to contract visibility</li>
              <li>Notification list with read updates</li>
            </ul>
          </aside>
        </div>
      </main>
    </div>
  );
}

import Link from "next/link";

export default function Home() {
  return (
    <div className="landing-wrap">
      <main className="hero-card">
        <span className="hero-kicker">Marketplace Frontend</span>
        <h1 className="hero-title">Build, pitch, and ship freelance projects faster.</h1>
        <p className="hero-subtitle">
          SkillBridge connects clients and freelancers through jobs, proposals, contracts, milestones, and in-app
          notifications. Start by signing in, then run the complete flow directly from the UI.
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
      </main>
    </div>
  );
}

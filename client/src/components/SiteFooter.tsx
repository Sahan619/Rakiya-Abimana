import Link from "next/link";
import { ArrowUpRight, Leaf } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-white/10 bg-[#102c22] text-white">
      <div className="page-width grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr] lg:py-16">
        <div>
          <Link href="/" className="inline-flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-[#d5ad63]">
              <Leaf size={22} />
            </span>
            <span>
              <span className="block text-lg font-bold tracking-tight">Rakiya-Abimana</span>
              <span className="block text-xs text-white/60">E-platform to promote self-employment</span>
            </span>
          </Link>
          <p className="mt-5 max-w-sm text-sm leading-6 text-white/65">
            A place to discover work, share your skills, and explore local business opportunities across Sri Lanka.
          </p>
        </div>

        <div>
          <h2 className="text-sm font-semibold">Explore</h2>
          <ul className="mt-4 space-y-3 text-sm text-white/65">
            <li><Link className="transition hover:text-white" href="/jobs">Find jobs</Link></li>
            <li><Link className="transition hover:text-white" href="/nearby">Nearby jobs</Link></li>
            <li><Link className="transition hover:text-white" href="/pitches">Funding opportunities</Link></li>
            <li><Link className="transition hover:text-white" href="/register">Create an account</Link></li>
          </ul>
        </div>

        <div>
          <h2 className="text-sm font-semibold">Your workspace</h2>
          <ul className="mt-4 space-y-3 text-sm text-white/65">
            <li><Link className="transition hover:text-white" href="/profile">Profile</Link></li>
            <li><Link className="transition hover:text-white" href="/jobs/applications">Applications</Link></li>
            <li><Link className="transition hover:text-white" href="/inbox">Messages</Link></li>
            <li><Link className="transition hover:text-white" href="/verification">Verification</Link></li>
          </ul>
        </div>

        <div>
          <h2 className="text-sm font-semibold">Languages & contact</h2>
          <p className="mt-4 text-sm leading-6 text-white/65">
            Explore the platform in English, සිංහල, or தமிழ். Opportunities and conversations are yours to explore in your preferred language.
          </p>
          <p className="mt-3 text-xs leading-5 text-white/45">No public contact details are listed on this project site.</p>
          <Link href="/jobs" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[#e2c382] transition hover:text-white">
            Explore opportunities <ArrowUpRight size={16} />
          </Link>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="page-width flex flex-col gap-2 py-5 text-xs text-white/50 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Rakiya-Abimana. All rights reserved.</p>
          <p>Opportunities without borders. Sri Lanka, together.</p>
        </div>
      </div>
    </footer>
  );
}

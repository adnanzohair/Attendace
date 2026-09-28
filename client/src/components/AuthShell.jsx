import AppFooter from "./AppFooter";
import { Clock, Calendar, FileText, Sparkles, ShieldCheck, CheckCircle2, UserCheck } from "lucide-react";
import tekglideLogoWhite from "../assets/tekglide-logo-main.webp";
import tekglideLogoDark from "../assets/tekglide-logo-footer.png";

const adminHighlights = [
  "Biometric punch imports with duplicate protection",
  "Attendance review, corrections, and audit trail",
  "Payslips, payroll register, and leave tracking",
];

/**
 * Split-screen frame shared by every sign-in / password screen.
 * Purely presentational — forms pass their own fields as children.
 */
export default function AuthShell({
  variant = "employee",
  eyebrow,
  title,
  subtitle,
  children,
}) {
  const isEmployee =
    variant === "employee" || (eyebrow && eyebrow.toLowerCase().includes("employee"));

  return (
    <div className="min-h-screen bg-white lg:grid lg:grid-cols-[1.1fr_1fr]">
      {/* Brand panel with Tekglide Theme */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-[#0c1620] p-10 xl:p-12 lg:flex selection:bg-[#f26322] selection:text-white">
        {/* Glowing background mesh pattern */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-[0.14]"
          style={{
            backgroundImage:
              "linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)",
            backgroundSize: "44px 44px",
            maskImage: "radial-gradient(ellipse 85% 65% at 30% 25%, #000, transparent 80%)",
            WebkitMaskImage: "radial-gradient(ellipse 85% 65% at 30% 25%, #000, transparent 80%)",
          }}
        />

        {/* Dynamic Tekglide Orange & Cyan Glow Orbs */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-20 -top-20 h-96 w-96 rounded-full bg-[#f26322]/25 blur-[110px]"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-20 bottom-1/4 h-80 w-80 rounded-full bg-[#00d2ff]/15 blur-[100px]"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-1/3 top-1/2 h-64 w-64 rounded-full bg-[#f26322]/15 blur-[90px]"
        />

        {/* Top Header with Crisp White Tekglide Logo */}
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src={tekglideLogoWhite}
              alt="Tekglide"
              className="h-9 w-auto max-w-[210px] object-contain filter drop-shadow"
            />
          </div>

          <div className="inline-flex items-center gap-2 rounded-full border border-[#f26322]/30 bg-[#f26322]/10 px-3.5 py-1 text-[11px] font-medium text-[#ff8a50] backdrop-blur-md">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#f26322] opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[#f26322]"></span>
            </span>
            {isEmployee ? "Tekglide Employee Hub" : "Tekglide Admin Console"}
          </div>
        </div>

        {/* Hero Section */}
        {isEmployee ? (
          <div className="relative my-auto max-w-lg space-y-6 py-8">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-[#f26322]/30 bg-[#f26322]/10 px-3.5 py-1 text-2xs font-semibold uppercase tracking-wider text-[#ff8a50] backdrop-blur-md">
              <Sparkles size={13} className="text-[#f26322]" />
              <span>Tekglide Personal Workspace</span>
            </div>

            <div>
              <h2 className="text-3xl font-extrabold leading-snug tracking-tight text-white xl:text-4xl">
                Your work schedule & payslips.{" "}
                <span className="bg-gradient-to-r from-[#f26322] via-[#ff8a50] to-[#ffb74d] bg-clip-text text-transparent">
                  All in your hands.
                </span>
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-slate-300/90">
                Log in to your Tekglide employee portal to track attendance, check upcoming shift schedules, submit leave requests, and view monthly payslips.
              </p>
            </div>

            {/* Interactive Tekglide Employee Glass Card Preview */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 shadow-2xl backdrop-blur-xl transition duration-300 hover:border-[#f26322]/40">
              <div className="flex items-center justify-between border-b border-white/10 pb-3.5">
                <div className="flex items-center gap-3">
                  <div className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-[#f26322] to-[#ea580c] text-xs font-bold text-white shadow-md">
                    <UserCheck size={18} />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-white">Employee Self-Service</div>
                    <div className="text-[11px] text-slate-400">Tekglide Workforce OS</div>
                  </div>
                </div>
                <span className="rounded-md border border-[#f26322]/30 bg-[#f26322]/10 px-2 py-0.5 text-[10px] font-semibold text-[#ff8a50]">
                  ● Verified Portal
                </span>
              </div>

              {/* 3 Quick Benefit Tiles */}
              <div className="mt-4 grid grid-cols-3 gap-2.5 text-left">
                <div className="rounded-xl border border-white/5 bg-white/[0.03] p-3 transition hover:bg-white/[0.06]">
                  <Clock size={16} className="text-[#f26322]" />
                  <div className="mt-2 text-[11px] font-semibold text-white">Shift & Hours</div>
                  <div className="mt-0.5 text-[10px] text-slate-400">Live punch tracking & hours</div>
                </div>

                <div className="rounded-xl border border-white/5 bg-white/[0.03] p-3 transition hover:bg-white/[0.06]">
                  <Calendar size={16} className="text-[#38bdf8]" />
                  <div className="mt-2 text-[11px] font-semibold text-white">Leave & PTO</div>
                  <div className="mt-0.5 text-[10px] text-slate-400">Request time off instantly</div>
                </div>

                <div className="rounded-xl border border-white/5 bg-white/[0.03] p-3 transition hover:bg-white/[0.06]">
                  <FileText size={16} className="text-[#ff8a50]" />
                  <div className="mt-2 text-[11px] font-semibold text-white">Digital Payslips</div>
                  <div className="mt-0.5 text-[10px] text-slate-400">Download salary slips</div>
                </div>
              </div>

              {/* Feature Badges */}
              <div className="mt-4 flex items-center justify-between pt-1 text-[11px] text-slate-400">
                <span className="inline-flex items-center gap-1">
                  <CheckCircle2 size={13} className="text-[#f26322]" /> 1-Tap Attendance
                </span>
                <span className="inline-flex items-center gap-1">
                  <CheckCircle2 size={13} className="text-[#f26322]" /> Real-time PTO Balance
                </span>
                <span className="inline-flex items-center gap-1">
                  <CheckCircle2 size={13} className="text-[#f26322]" /> Encrypted Payslips
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="relative my-auto max-w-md py-8">
            <p className="text-2xs font-semibold uppercase tracking-[0.18em] text-[#ff8a50]">
              {eyebrow || "Tekglide Admin & HR"}
            </p>
            <h2 className="mt-4 text-3xl font-bold leading-tight tracking-tight text-white xl:text-4xl">
              Workforce intelligence, shift roster, and payroll in control.
            </h2>
            <ul className="mt-8 space-y-3.5">
              {adminHighlights.map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm text-slate-300">
                  <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[#f26322] shadow-sm shadow-[#f26322]" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Footer */}
        <div className="relative flex items-center justify-between text-xs text-slate-400/80">
          <div>© {new Date().getFullYear()} Tekglide Inc. · All rights reserved</div>
          <div className="inline-flex items-center gap-1.5 text-slate-400">
            <ShieldCheck size={14} className="text-[#f26322]" />
            <span>256-bit Secure Connection</span>
          </div>
        </div>
      </div>

      {/* Form panel */}
      <div className="flex min-h-screen flex-col lg:min-h-0">
        <div className="flex flex-1 items-center justify-center px-6 py-12">
          <div className="w-full max-w-sm">
            <div className="mb-8 flex items-center gap-2.5 lg:hidden">
              <img
                src={tekglideLogoDark}
                alt="Tekglide"
                className="h-8 w-auto max-w-[160px] object-contain"
              />
              <span className="ml-1 rounded border border-[#f26322]/30 bg-[#f26322]/10 px-2 py-0.5 text-[10px] font-semibold text-[#f26322]">
                {isEmployee ? "Employee Portal" : "Admin"}
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-ink">{title}</h1>
            {subtitle && <p className="mt-2 text-sm leading-relaxed text-slate-500">{subtitle}</p>}
            <div className="mt-8">{children}</div>
          </div>
        </div>
        <AppFooter />
      </div>
    </div>
  );
}

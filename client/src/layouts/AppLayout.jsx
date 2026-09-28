import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  CalendarCheck,
  FileUp,
  TriangleAlert,
  CalendarDays,
  Banknote,
  ReceiptText,
  Settings,
  LogOut,
  CalendarHeart,
  ShieldCheck,
  ClipboardCheck,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import AppFooter from "../components/AppFooter";
import tekglideLogoDark from "../assets/tekglide-logo-footer.png";

const groups = [
  {
    title: "Overview",
    links: [["/dashboard", "Dashboard", LayoutDashboard]],
  },
  {
    title: "People",
    links: [
      ["/employees", "Employees", Users],
      ["/employees/import", "Import Employees", FileUp],
    ],
  },
  {
    title: "Attendance",
    links: [
      ["/attendance", "Attendance", CalendarCheck],
      ["/attendance/import", "Import Attendance", FileUp],
      ["/attendance/exceptions", "Exceptions", TriangleAlert],
      ["/attendance/monthly", "Monthly Report", CalendarDays],
      ["/holidays", "Holidays", CalendarHeart],
      ["/leave-requests", "Leave Requests", ClipboardCheck],
    ],
  },
  {
    title: "Payroll",
    links: [
      ["/payroll", "Payroll", Banknote],
      ["/payslips", "Payslips", ReceiptText],
    ],
  },
  {
    title: "Administration",
    links: [
      ["/settings", "Settings", Settings],
      ["/admin-users", "Admin Users", ShieldCheck, true],
    ],
  },
];

const initials = (name = "") =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase() || "—";

function Wordmark() {
  return (
    <div className="flex items-center gap-2.5">
      <img src={tekglideLogoDark} alt="Tekglide" className="h-7 w-auto object-contain" />
      <span className="rounded border border-blue-200 bg-blue-50 px-1.5 py-0.5 text-[10px] font-semibold text-blue-600 uppercase tracking-wider">
        Workforce
      </span>
    </div>
  );
}

export default function AppLayout() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const { pathname } = useLocation();
  const visible = groups
    .map((group) => ({
      ...group,
      links: group.links.filter(([, , , ownerOnly]) => !ownerOnly || user?.role === "owner"),
    }))
    .filter((group) => group.links.length);

  // Highlight only the most specific matching link, so "/employees/import"
  // does not also light up "/employees".
  const current = visible
    .flatMap((group) => group.links)
    .map(([to]) => to)
    .filter((to) => pathname === to || pathname.startsWith(`${to}/`))
    .sort((a, b) => b.length - a.length)[0];

  async function signOut() {
    await logout();
    nav("/login");
  }

  const navItems = ([to, label, Icon]) => (
    <Link key={to} to={to} className={`nav-link ${to === current ? "nav-link-active" : ""}`}>
      <Icon size={17} strokeWidth={2} className="shrink-0" />
      <span className="truncate">{label}</span>
    </Link>
  );

  return (
    <div className="min-h-screen lg:flex">
      {/* Desktop sidebar */}
      <aside className="sidebar-nav sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-slate-200 bg-white lg:flex">
        <div className="flex h-16 items-center border-b border-slate-200 px-5">
          <Wordmark />
        </div>
        <nav className="flex-1 overflow-y-auto px-3 pb-4">
          {visible.map((group) => (
            <div key={group.title}>
              <div className="nav-section">{group.title}</div>
              <div className="space-y-0.5">{group.links.map(navItems)}</div>
            </div>
          ))}
        </nav>
        <div className="border-t border-slate-200 p-3">
          <div className="flex items-center gap-3 rounded-lg px-2 py-2">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand-50 text-xs font-bold text-brand-700 ring-1 ring-inset ring-brand-100">
              {initials(user?.name)}
            </div>
            <div className="min-w-0 flex-1 leading-tight">
              <div className="truncate text-sm font-semibold text-ink">{user?.name}</div>
              <div className="truncate text-xs capitalize text-slate-500">{user?.role}</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile header + nav */}
      <div className="lg:hidden">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-slate-200 bg-white/90 px-4 backdrop-blur">
          <Wordmark />
          <button onClick={signOut} className="btn-icon" title="Sign out" aria-label="Sign out">
            <LogOut size={18} />
          </button>
        </header>
        <nav className="flex gap-1.5 overflow-x-auto border-b border-slate-200 bg-white px-3 py-2">
          {visible.flatMap((group) => group.links).map(navItems)}
        </nav>
      </div>

      <main className="min-w-0 flex-1 bg-sand">
        <header className="sticky top-0 z-20 hidden h-16 items-center justify-end gap-3 border-b border-slate-200 bg-white/85 px-8 backdrop-blur lg:flex">
          <div className="text-right leading-tight">
            <div className="text-sm font-semibold text-ink">{user?.name}</div>
            <div className="text-xs text-slate-500">{user?.email}</div>
          </div>
          <div className="mx-1 h-6 w-px bg-slate-200" />
          <button onClick={signOut} className="btn-secondary btn-sm" title="Sign out">
            <LogOut size={15} />
            Sign out
          </button>
        </header>
        <div className="mx-auto max-w-[1600px] p-4 lg:p-8">
          <Outlet />
        </div>
        <AppFooter />
      </main>
    </div>
  );
}

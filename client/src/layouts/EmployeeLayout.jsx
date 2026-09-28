import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  CalendarCheck,
  CalendarPlus,
  LayoutDashboard,
  LogOut,
  ReceiptText,
  UserRound,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";
import { useEmployeeAuth } from "../context/EmployeeAuthContext";
import AppFooter from "../components/AppFooter";
import tekglideLogoWhite from "../assets/tekglide-logo-main.webp";
import tekglideLogoDark from "../assets/tekglide-logo-footer.png";

const links = [
  ["/employee/dashboard", "Dashboard", LayoutDashboard],
  ["/employee/attendance", "Attendance", CalendarCheck],
  ["/employee/leave", "Leave", CalendarPlus],
  ["/employee/payslips", "Payslips", ReceiptText],
  ["/employee/profile", "Profile", UserRound],
];

const initials = (name = "") =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase() || "—";

export default function EmployeeLayout() {
  const { employee, logout } = useEmployeeAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  return (
    <div className="flex min-h-screen bg-[#f8fafc] font-sans antialiased text-slate-800">
      {/* 1. Zoho People Style Dark Left Navigation Sidebar */}
      <aside className="sticky top-0 hidden h-screen w-20 flex-col items-center justify-between border-r border-slate-900/10 bg-[#0c1620] py-4 text-white lg:flex shrink-0 z-30">
        <div className="flex flex-col items-center gap-6 w-full">
          {/* Logo mark */}
          <Link to="/employee/dashboard" className="p-2 transition hover:opacity-80" title="Tekglide Workforce">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-tr from-[#f26322] to-amber-500 text-base font-bold text-white shadow-lg shadow-orange-500/20">
              T
            </div>
          </Link>

          {/* Nav Icons */}
          <nav className="flex flex-col gap-2.5 w-full px-2">
            {links.map(([to, label, Icon]) => {
              const active = pathname === to || pathname.startsWith(`${to}/`);
              return (
                <Link
                  key={to}
                  to={to}
                  title={label}
                  className={`group relative flex flex-col items-center gap-1 rounded-xl p-2.5 text-[11px] font-semibold transition-all ${
                    active
                      ? "bg-[#0091ff] text-white shadow-md shadow-blue-500/30"
                      : "text-slate-400 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <Icon size={20} />
                  <span className="text-[10px] leading-none font-medium">{label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User initials / Sign out */}
        <div className="flex flex-col items-center gap-3 px-2">
          <button
            onClick={async () => {
              await logout();
              navigate("/employee/login");
            }}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 transition hover:bg-white/10 hover:text-rose-400"
            title="Sign out"
          >
            <LogOut size={18} />
          </button>
        </div>
      </aside>

      {/* 2. Main Content Area */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Top Header */}
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200/80 bg-white/90 px-4 lg:px-8 backdrop-blur">
          {/* Mobile logo & Brand tag */}
          <div className="flex items-center gap-3">
            <img
              src={tekglideLogoDark}
              alt="Tekglide"
              className="h-7 w-auto object-contain"
            />
            <div className="hidden h-4 w-px bg-slate-300 sm:block" />
            <span className="hidden text-2xs font-semibold uppercase tracking-[0.14em] text-slate-400 sm:inline">
              Workforce Portal
            </span>
          </div>

          {/* User profile & actions */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2.5 rounded-full border border-slate-200 bg-slate-50 py-1 px-3 shadow-2xs">
              <div className="grid h-7 w-7 place-items-center rounded-full bg-[#f26322] text-xs font-bold text-white">
                {initials(employee?.name)}
              </div>
              <div className="text-left leading-tight hidden sm:block">
                <div className="text-xs font-bold text-slate-800">
                  {employee?.name}
                </div>
                <div className="text-[10px] text-slate-400">
                  ID: {employee?.employeeId}
                </div>
              </div>
            </div>

            <button
              onClick={async () => {
                await logout();
                navigate("/employee/login");
              }}
              className="btn-secondary btn-sm"
              title="Sign out"
            >
              <LogOut size={15} />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        </header>

        {/* Mobile Horizontal Nav Bar */}
        <div className="border-b border-slate-200 bg-white px-3 py-2 lg:hidden">
          <nav className="flex gap-1 overflow-x-auto">
            {links.map(([to, label, Icon]) => {
              const active = pathname === to || pathname.startsWith(`${to}/`);
              return (
                <Link
                  key={to}
                  to={to}
                  className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition ${
                    active
                      ? "bg-[#0091ff] text-white"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <Icon size={15} />
                  {label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Page Content */}
        <main className="mx-auto w-full max-w-[1600px] flex-1 p-4 lg:p-8">
          <Outlet />
        </main>
        <AppFooter />
      </div>
    </div>
  );
}

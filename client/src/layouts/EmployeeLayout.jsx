import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  CalendarCheck,
  CalendarPlus,
  LayoutDashboard,
  LogOut,
  ReceiptText,
  UserRound,
} from "lucide-react";
import { useEmployeeAuth } from "../context/EmployeeAuthContext";
import AppFooter from "../components/AppFooter";
import tekglideLogoDark from "../assets/tekglide-logo-footer.png";

const links = [
  ["/employee/dashboard", "Dashboard", LayoutDashboard],
  ["/employee/attendance", "My Attendance", CalendarCheck],
  ["/employee/leave", "My Leave", CalendarPlus],
  ["/employee/payslips", "My Payslips", ReceiptText],
  ["/employee/profile", "My Profile", UserRound],
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
    <div className="flex min-h-screen flex-col bg-sand">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
          <div className="flex items-center gap-3">
            <img src={tekglideLogoDark} alt="Tekglide" className="h-7 w-auto object-contain" />
            <div className="h-4 w-px bg-slate-300" />
            <span className="text-2xs font-semibold uppercase tracking-[0.14em] text-slate-500">
              Employee Portal
            </span>
          </div>
          <button onClick={async () => { await logout(); navigate("/employee/login"); }} className="btn-secondary btn-sm">
            <LogOut size={15} />
            <span className="hidden sm:inline">Sign out</span>
          </button>
        </div>
        <div className="mx-auto max-w-6xl px-4">
          <nav className="flex gap-1 overflow-x-auto">
            {links.map(([to, label, Icon]) => {
              const active = pathname === to || pathname.startsWith(`${to}/`);
              return (
                <Link
                  key={to}
                  to={to}
                  className={`flex shrink-0 items-center gap-2 border-b-2 px-3 py-3 text-sm font-medium transition-colors ${
                    active
                      ? "border-brand-600 text-brand-700"
                      : "border-transparent text-slate-500 hover:border-slate-300 hover:text-ink"
                  }`}
                >
                  <Icon size={16} />
                  {label}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 p-4 lg:p-8">
        <div className="mb-6 flex items-center gap-3.5">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-brand-50 text-sm font-bold text-brand-700 ring-1 ring-inset ring-brand-100">
            {initials(employee?.name)}
          </div>
          <div className="leading-tight">
            <h1 className="text-xl font-semibold tracking-tight text-ink">
              Welcome, {employee?.name}
            </h1>
            <p className="mt-0.5 text-sm text-slate-500">Employee ID {employee?.employeeId}</p>
          </div>
        </div>
        <Outlet />
      </main>
      <AppFooter />
    </div>
  );
}

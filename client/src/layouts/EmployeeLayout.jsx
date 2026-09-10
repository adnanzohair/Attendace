import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { CalendarCheck, LayoutDashboard, LogOut, ReceiptText, UserRound } from "lucide-react";
import { useEmployeeAuth } from "../context/EmployeeAuthContext";
import AppFooter from "../components/AppFooter";
const links = [["/employee/dashboard", "Dashboard", LayoutDashboard], ["/employee/attendance", "My Attendance", CalendarCheck], ["/employee/payslips", "My Payslips", ReceiptText], ["/employee/profile", "My Profile", UserRound]];
export default function EmployeeLayout() {
  const { employee, logout } = useEmployeeAuth(), navigate = useNavigate();
  return <div className="flex min-h-screen flex-col bg-slate-50"><header className="bg-ink px-4 py-4 text-white"><div className="mx-auto flex max-w-6xl items-center justify-between"><div><b className="text-xl">Attendly</b><span className="ml-3 text-xs text-white/60">Employee Portal</span></div><button onClick={async()=>{await logout();navigate("/employee/login")}} className="flex items-center gap-2 text-sm"><LogOut size={17}/> Sign out</button></div></header><nav className="border-b bg-white"><div className="mx-auto flex max-w-6xl gap-1 overflow-x-auto p-2">{links.map(([to,label,Icon])=><NavLink key={to} to={to} className={({isActive})=>`flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm ${isActive?"bg-brand-600 text-white":"text-slate-600"}`}><Icon size={16}/>{label}</NavLink>)}</div></nav><main className="mx-auto w-full max-w-6xl flex-1 p-4 lg:p-8"><div className="mb-5"><h1 className="text-xl font-bold">Welcome, {employee?.name}</h1><p className="text-sm text-slate-500">Employee ID {employee?.employeeId}</p></div><Outlet/></main><AppFooter/></div>;
}

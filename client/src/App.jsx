import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import { Spinner } from "./components/ui";
import AppLayout from "./layouts/AppLayout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Employees from "./pages/Employees";
import EmployeeDetail from "./pages/EmployeeDetail";
import ImportEmployees from "./pages/ImportEmployees";
import Attendance from "./pages/Attendance";
import AttendanceDetail from "./pages/AttendanceDetail";
import ImportAttendance from "./pages/ImportAttendance";
import Exceptions from "./pages/Exceptions";
import Monthly from "./pages/Monthly";
import Settings from "./pages/Settings";
import Holidays from "./pages/Holidays";
import Payslips from "./pages/Payslips";
import ComingSoon from "./pages/ComingSoon";
function Protected() {
  const { user, loading } = useAuth();
  if (loading)
    return (
      <div className="grid min-h-screen place-items-center">
        <Spinner />
      </div>
    );
  return user ? <AppLayout /> : <Navigate to="/login" replace />;
}
export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<Protected />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/employees" element={<Employees />} />
        <Route path="/employees/import" element={<ImportEmployees />} />
        <Route path="/employees/:id" element={<EmployeeDetail />} />
        <Route path="/attendance" element={<Attendance />} />
        <Route path="/attendance/import" element={<ImportAttendance />} />
        <Route path="/attendance/exceptions" element={<Exceptions />} />
        <Route path="/attendance/monthly" element={<Monthly />} />
        <Route path="/attendance/:id" element={<AttendanceDetail />} />
        <Route path="/holidays" element={<Holidays />} />
        <Route path="/payroll" element={<ComingSoon title="Payroll" />} />
        <Route path="/payslips" element={<Payslips />} />
        <Route path="/settings" element={<Settings />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

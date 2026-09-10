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
import { useEmployeeAuth } from "./context/EmployeeAuthContext";
import EmployeeLayout from "./layouts/EmployeeLayout";
import EmployeeLogin from "./pages/employee/EmployeeLogin";
import { EmployeeActivate, EmployeeForgotPassword, EmployeeResetPassword } from "./pages/employee/EmployeePasswordForms";
import EmployeeDashboard from "./pages/employee/EmployeeDashboard";
import MyAttendance from "./pages/employee/MyAttendance";
import MyPayslips from "./pages/employee/MyPayslips";
import MyProfile from "./pages/employee/MyProfile";
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
function EmployeeProtected() {
  const { employee, loading } = useEmployeeAuth();
  if (loading) return <div className="grid min-h-screen place-items-center"><Spinner /></div>;
  return employee ? <EmployeeLayout /> : <Navigate to="/employee/login" replace />;
}
export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/employee/login" element={<EmployeeLogin />} />
      <Route path="/employee/activate/:token" element={<EmployeeActivate />} />
      <Route path="/employee/forgot-password" element={<EmployeeForgotPassword />} />
      <Route path="/employee/reset-password/:token" element={<EmployeeResetPassword />} />
      <Route element={<EmployeeProtected />}>
        <Route path="/employee/dashboard" element={<EmployeeDashboard />} />
        <Route path="/employee/attendance" element={<MyAttendance />} />
        <Route path="/employee/payslips" element={<MyPayslips />} />
        <Route path="/employee/profile" element={<MyProfile />} />
      </Route>
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

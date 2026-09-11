import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import authRoutes from "./routes/auth.js";
import employees from "./routes/employees.js";
import employeeReports from "./routes/employeeReports.js";
import shifts from "./routes/shifts.js";
import attendance from "./routes/attendance.js";
import dashboard from "./routes/dashboard.js";
import reports from "./routes/reports.js";
import settings from "./routes/settings.js";
import holidays from "./routes/holidays.js";
import payslips from "./routes/payslips.js";
import employeeAuthRoutes from "./routes/employeeAuth.js";
import employeePortalRoutes from "./routes/employeePortal.js";
import adminUsers from "./routes/adminUsers.js";
import { auth, errorHandler } from "./middleware/auth.js";
import { databaseMiddleware } from "./config/db.js";
const app = express(),
  allowedOrigin = (origin, cb) => {
    const configured = (process.env.CLIENT_URL || "")
        .split(",")
        .map((x) => x.trim()),
      local =
        process.env.NODE_ENV !== "production" &&
        /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin || "");
    !origin || configured.includes(origin) || local
      ? cb(null, true)
      : cb(new Error("Origin is not allowed by CORS"));
  };
app.use(
  helmet(),
  cors({ origin: allowedOrigin, credentials: true }),
  express.json({ limit: "1mb" }),
  cookieParser(),
);
app.use("/api", databaseMiddleware);
app.get("/api/health", (req, res) => res.json({ status: "ok", database: "connected" }));
app.use("/api/employee-portal/auth", employeeAuthRoutes);
app.use("/api/employee-portal", employeePortalRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/admin-users", adminUsers);
app.use("/api/dashboard", auth, dashboard);
app.use("/api/employees", auth, employees);
app.use("/api/employee-reports", auth, employeeReports);
app.use("/api/shifts", auth, shifts);
app.use("/api/attendance", auth, attendance);
app.use("/api/reports", auth, reports);
app.use("/api/settings", auth, settings);
app.use("/api/holidays", auth, holidays);
app.use("/api/payslips", auth, payslips);
app.use((req, res) => res.status(404).json({ message: "Route not found" }));
app.use(errorHandler);
export default app;

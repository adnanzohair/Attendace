import { Router } from "express";
import {
  Attendance,
  AttendanceException,
  Employee,
  Holiday,
} from "../models/index.js";
import { asyncHandler } from "../utils/http.js";
const r = Router();
r.get(
  "/",
  asyncHandler(async (req, res) => {
    const date = req.query.date || new Date().toISOString().slice(0, 10),
      [totalEmployees, records, missingPunches, attendanceErrors, holiday] =
        await Promise.all([
          Employee.countDocuments({ status: "active" }),
          Attendance.find({ workDate: date })
            .populate("employee")
            .sort("-updatedAt")
            .limit(20),
          AttendanceException.countDocuments({
            workDate: date,
            status: "open",
            type: /^Missing/,
          }),
          AttendanceException.countDocuments({
            workDate: date,
            status: "open",
            type: "Attendance Error",
          }),
          Holiday.findOne({ date, active: true }),
        ]),
      has = (c) => records.filter((x) => x.conditions.includes(c)).length;
    res.json({
      date,
      holiday,
      stats: {
        totalEmployees,
        present: holiday ? 0 : has("Present"),
        absent: holiday ? 0 : Math.max(0, totalEmployees - has("Present")),
        late: holiday ? 0 : has("Late"),
        shortHours: holiday ? 0 : has("Short Hours"),
        missingPunches: holiday ? 0 : missingPunches,
        attendanceErrors: holiday ? 0 : attendanceErrors,
      },
      recent: holiday ? [] : records,
    });
  }),
);
export default r;

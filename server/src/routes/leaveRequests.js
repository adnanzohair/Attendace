import { Router } from "express";
import { Attendance, AttendanceAdjustment, Holiday, LeaveRequest, Settings, Shift } from "../models/index.js";
import { AppError, asyncHandler } from "../utils/http.js";
import { scheduleForDay } from "../services/companySchedule.js";
import { approvedLeaveValues, attendanceLeaveConflict } from "../services/approvedLeaveAttendance.js";
import { workingLeaveDates } from "../services/leaveRequestPolicy.js";

const r = Router();

async function companyShift(workDate) {
  const day = new Date(`${workDate}T12:00:00`).getDay();
  const settings = await Settings.findOne({ key: "global" }).lean();
  const schedule = scheduleForDay(day, settings?.attendanceGrace);
  return Shift.findOneAndUpdate(
    { name: schedule.name },
    { $set: { ...schedule, active: true, processingWindowBeforeMinutes: 240, processingWindowAfterMinutes: 240 } },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );
}

r.get("/", asyncHandler(async (req, res) => {
  const filter = {};
  if (["pending", "approved", "rejected"].includes(req.query.status)) filter.status = req.query.status;
  if (["sick", "casual", "other"].includes(req.query.type)) filter.requestedType = req.query.type;
  if (req.query.startDate) filter.endDate = { $gte: req.query.startDate };
  if (req.query.endDate) filter.startDate = { $lte: req.query.endDate };
  const requests = await LeaveRequest.find(filter).populate("employee", "name employeeId department designation leavePolicy").populate("reviewedBy", "name email").sort({ createdAt: -1 }).limit(500).lean();
  res.json({ data: requests });
}));

r.post("/:id/approve", asyncHandler(async (req, res) => {
  const approvedType = String(req.body.approvedType || "");
  if (!["sick", "casual", "unpaid"].includes(approvedType)) throw new AppError(422, "Choose Sick, Casual, or Unpaid leave treatment");
  const adminNote = String(req.body.adminNote || "").trim();
  if (adminNote.length > 1000) throw new AppError(422, "Admin note cannot exceed 1,000 characters");
  const request = await LeaveRequest.findOne({ _id: req.params.id, status: "pending" }).populate("employee");
  if (!request) throw new AppError(404, "Pending leave request not found");
  if (request.employee?.status !== "active") throw new AppError(409, "The employee is inactive");

  const holidays = await Holiday.find({ date: { $gte: request.startDate, $lte: request.endDate }, active: true }).select("date").lean();
  const dates = workingLeaveDates(request.startDate, request.endDate, new Set(holidays.map((holiday) => holiday.date)));
  if (!dates.length) throw new AppError(422, "This request contains no working days after weekends and holidays are excluded");
  const existing = await Attendance.find({ employeeId: request.employeeId, workDate: { $in: dates } });
  const existingByDate = new Map(existing.map((record) => [record.workDate, record]));
  const conflicts = dates.flatMap((workDate) => {
    const reason = attendanceLeaveConflict(existingByDate.get(workDate));
    return reason ? [{ workDate, reason }] : [];
  });
  if (conflicts.length) throw new AppError(409, "Leave cannot be approved until conflicting attendance is reviewed", conflicts);

  const attendanceIds = [];
  for (const workDate of dates) {
    const current = existingByDate.get(workDate);
    const shift = await companyShift(workDate);
    const values = approvedLeaveValues({ employee: request.employee, shift, workDate, approvedType, leaveRequest: request._id });
    values.adjustmentReason = `Approved leave request: ${request.reason}`;
    const record = await Attendance.findOneAndUpdate(
      { employeeId: request.employeeId, workDate },
      { $set: values },
      { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true },
    );
    attendanceIds.push(record._id);
    await AttendanceAdjustment.create({
      attendance: record._id,
      employeeId: request.employeeId,
      workDate,
      changedBy: req.user._id,
      before: current?.toObject() || null,
      after: record.toObject(),
      reason: `Approved ${approvedType} leave request${adminNote ? `: ${adminNote}` : ""}`,
    });
  }

  request.status = "approved";
  request.approvedType = approvedType;
  request.adminNote = adminNote;
  request.reviewedBy = req.user._id;
  request.reviewedAt = new Date();
  request.attendanceIds = attendanceIds;
  await request.save();
  res.json({ message: `Leave approved for ${dates.length} working day(s)`, request });
}));

r.post("/:id/reject", asyncHandler(async (req, res) => {
  const adminNote = String(req.body.adminNote || "").trim();
  if (!adminNote || adminNote.length > 1000) throw new AppError(422, "A rejection reason is required and cannot exceed 1,000 characters");
  const request = await LeaveRequest.findOneAndUpdate(
    { _id: req.params.id, status: "pending" },
    { status: "rejected", approvedType: null, adminNote, reviewedBy: req.user._id, reviewedAt: new Date() },
    { new: true, runValidators: true },
  );
  if (!request) throw new AppError(404, "Pending leave request not found");
  res.json({ message: "Leave request rejected", request });
}));

export default r;

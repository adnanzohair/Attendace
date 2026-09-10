import { Router } from "express";
import multer from "multer";
import XLSX from "xlsx";
import { Attendance, Employee, EmployeeAccount } from "../models/index.js";
import { AppError, asyncHandler, pageMeta } from "../utils/http.js";
import { createAccountToken } from "../services/accountTokens.js";
import { sendEmployeeAccountLink } from "../services/employeeAccountMailer.js";

const r = Router();
const upload = multer({ storage: multer.memoryStorage() });
const editableFields = ["employeeId", "name", "fatherName", "designation", "department", "joiningDate", "phone", "email", "status", "monthlySalary", "salaryCurrency", "payrollSettings", "leavePolicy"];

function employeePayload(body) {
  const payload = Object.fromEntries(editableFields.filter((field) => body[field] !== undefined).map((field) => [field, body[field]]));
  if (payload.monthlySalary === "" || payload.monthlySalary == null) payload.monthlySalary = 0;
  if (payload.monthlySalary !== undefined) {
    payload.monthlySalary = Number(payload.monthlySalary);
    if (!Number.isFinite(payload.monthlySalary) || payload.monthlySalary < 0) throw new AppError(422, "Monthly salary must be zero or a positive number");
  }
  if (payload.salaryCurrency !== undefined && !["PKR", "USD"].includes(payload.salaryCurrency)) throw new AppError(422, "Salary currency must be PKR or USD");
  if (payload.joiningDate === "") payload.joiningDate = null;
  if (payload.payrollSettings) payload.payrollSettings = {
    lateDeductionOverride: ["inherit", "enabled", "disabled"].includes(payload.payrollSettings.lateDeductionOverride) ? payload.payrollSettings.lateDeductionOverride : "inherit",
    overtimeEligible: Boolean(payload.payrollSettings.overtimeEligible),
  };
  if (payload.leavePolicy) {
    const sickGranted = Number(payload.leavePolicy.sickGranted || 0), casualGranted = Number(payload.leavePolicy.casualGranted || 0);
    if (!Number.isFinite(sickGranted) || sickGranted < 0 || !Number.isFinite(casualGranted) || casualGranted < 0) throw new AppError(422, "Granted leave must be zero or a positive number");
    payload.leavePolicy = { sickGranted, casualGranted };
  }
  return payload;
}

function info(buffer) {
  const wb = XLSX.read(buffer, { type: "buffer" });
  const preferred = wb.SheetNames.includes("Sheet2") ? "Sheet2" : wb.SheetNames[0];
  const matrix = XLSX.utils.sheet_to_json(wb.Sheets[preferred], { header: 1, defval: "", raw: false });
  const headerIndex = matrix.findIndex((x) => x.some((v) => ["Emp ID", "Enroll ID"].includes(String(v).trim())));
  if (headerIndex < 0) throw new AppError(422, "Could not find Emp ID or Enroll ID");
  const headers = matrix[headerIndex].map((v) => String(v).trim());
  const machine = headers.includes("Enroll ID");
  return { sheetName: preferred, matrix, headerIndex, headers, mapping: machine ? { employeeId: "Enroll ID", name: "Name", department: "Dept" } : { employeeId: "Emp ID", name: "Name of Employees", fatherName: "Father Name", designation: "Designation", phone: "Mobile Number", email: "Email Address" } };
}

r.get("/", asyncHandler(async (req, res) => {
  const filters = [];
  if (req.query.search) filters.push({ $or: ["employeeId", "name", "department", "designation"].map((k) => ({ [k]: { $regex: req.query.search, $options: "i" } })) });
  if (["active", "inactive"].includes(req.query.status)) filters.push({ status: req.query.status });
  const employees = await Employee.find(filters.length ? { $and: filters } : {}).sort("name").limit(500).lean();
  const year = new Date().getFullYear(), ids = employees.map((employee) => employee.employeeId);
  const leaveRecords = ids.length ? await Attendance.find({ employeeId: { $in: ids }, workDate: { $gte: `${year}-01-01`, $lte: `${year}-12-31` }, conditions: "Leave" }).select("employeeId leaveType conditions").lean() : [];
  const usage = new Map();
  for (const record of leaveRecords) { const current = usage.get(record.employeeId) || { sickUsed: 0, casualUsed: 0 }; if (record.leaveType === "sick" || record.conditions?.includes("Sick Leave")) current.sickUsed++; if (record.leaveType === "casual" || record.conditions?.includes("Casual Leave")) current.casualUsed++; usage.set(record.employeeId, current); }
  const data = employees.map((employee) => ({ ...employee, leaveUsage: { year, sickUsed: 0, casualUsed: 0, ...usage.get(employee.employeeId) } }));
  res.json({ data, meta: pageMeta(1, 500, data.length) });
}));

r.post("/inspect", upload.single("file"), asyncHandler(async (req, res) => {
  if (!req.file) throw new AppError(400, "Choose a file");
  const x = info(req.file.buffer), rows = x.matrix.slice(x.headerIndex + 1).filter((a) => a.some((v) => String(v).trim())), id = x.headers.indexOf(x.mapping.employeeId);
  const unique = new Set(rows.map((a) => String(a[id] ?? "").trim()).filter(Boolean));
  res.json({ sheetName: x.sheetName, headerRow: x.headerIndex + 1, headers: x.headers, suggestedMapping: x.mapping, summary: { rows: rows.length, withEmployeeId: rows.filter((a) => String(a[id] ?? "").trim()).length, uniqueEmployees: unique.size } });
}));

r.post("/import", upload.single("file"), asyncHandler(async (req, res) => {
  if (!req.file) throw new AppError(400, "Choose a file");
  const x = info(req.file.buffer), mapping = JSON.parse(req.body.mapping || JSON.stringify(x.mapping));
  const idx = Object.fromEntries(Object.entries(mapping).map(([k, v]) => [k, x.headers.indexOf(v)]));
  if (idx.employeeId < 0 || idx.name < 0) throw new AppError(422, "Employee ID and name must be mapped");
  let created = 0, updated = 0, skipped = 0, duplicateRows = 0;
  const seen = new Set(), skipReasons = { missingEmployeeId: 0, missingName: 0 };
  for (const row of x.matrix.slice(x.headerIndex + 1)) {
    if (!row.some((v) => String(v).trim())) continue;
    const get = (k) => idx[k] >= 0 ? String(row[idx[k]] ?? "").trim() : "", employeeId = get("employeeId"), name = get("name");
    if (!employeeId) { skipped++; skipReasons.missingEmployeeId++; continue; }
    if (!name) { skipped++; skipReasons.missingName++; continue; }
    if (seen.has(employeeId)) { duplicateRows++; continue; }
    seen.add(employeeId);
    const values = { employeeId, name, status: "active" };
    for (const k of ["fatherName", "designation", "phone", "email", "department"]) if (get(k)) values[k] = get(k);
    const exists = await Employee.exists({ employeeId });
    await Employee.updateOne({ employeeId }, { $set: values }, { upsert: true, runValidators: true });
    exists ? updated++ : created++;
  }
  res.status(201).json({ uniqueEmployees: seen.size, created, updated, skipped, duplicateRows, skipReasons });
}));

r.post("/", asyncHandler(async (req, res) => res.status(201).json(await Employee.create(employeePayload(req.body)))));
r.post("/:id/invite", asyncHandler(async (req, res) => {
  const employee = await Employee.findById(req.params.id);
  if (!employee || employee.status !== "active") throw new AppError(404, "Active employee not found");
  const email = String(employee.email || "").trim().toLowerCase();
  if (!email) throw new AppError(422, "Add a valid employee email before sending an invitation");
  const existingAccount = await EmployeeAccount.findOne({ employee: employee._id });
  if (existingAccount?.status === "active") throw new AppError(409, "This employee already has an active portal account. They can use Forgot Password if needed.");
  const duplicate = await EmployeeAccount.findOne({ email, employee: { $ne: employee._id } });
  if (duplicate) throw new AppError(409, "This email belongs to another employee portal account");
  const token = createAccountToken();
  const account = await EmployeeAccount.findOneAndUpdate({ employee: employee._id }, { $set: { email, status: "invited", inviteTokenHash: token.tokenHash, inviteExpiresAt: new Date(Date.now() + 3600000) } }, { upsert: true, new: true, runValidators: true });
  await sendEmployeeAccountLink({ recipient: email, employeeName: employee.name, purpose: "activation", url: `${process.env.CLIENT_URL}/employee/activate/${token.rawToken}` });
  res.json({ message: `Invitation sent to ${email}`, accountStatus: account.status });
}));
r.get("/:id", asyncHandler(async (req, res) => {
  const employee = await Employee.findById(req.params.id);
  if (!employee) throw new AppError(404, "Employee not found");
  res.json({ employee, attendance: await Attendance.find({ employeeId: employee.employeeId }) });
}));
r.put("/:id", asyncHandler(async (req, res) => {
  const employee = await Employee.findByIdAndUpdate(req.params.id, { $set: employeePayload(req.body) }, { new: true, runValidators: true });
  if (!employee) throw new AppError(404, "Employee not found");
  res.json(employee);
}));
r.delete("/:id", asyncHandler(async (req, res) => {
  const employee = await Employee.findByIdAndUpdate(req.params.id, { status: "inactive" }, { new: true });
  if (!employee) throw new AppError(404, "Employee not found");
  res.json(employee);
}));

export default r;

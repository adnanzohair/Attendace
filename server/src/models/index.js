import mongoose from "mongoose";
const { Schema, model } = mongoose;
const payrollSettings = {
  lateDeductionOverride: {
    type: String,
    enum: ["inherit", "enabled", "disabled"],
    default: "inherit",
  },
  overtimeEligible: { type: Boolean, default: false },
};
const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: { type: String, select: false },
    role: { type: String, enum: ["owner", "admin", "hr"], default: "admin" },
    active: { type: Boolean, default: true },
    accountState: { type: String, enum: ["invited", "active", "disabled"], default: "active" },
    inviteTokenHash: { type: String, select: false },
    inviteExpiresAt: Date,
    passwordChangedAt: Date,
    lastLoginAt: Date,
  },
  { timestamps: true },
);
const shiftSchema = new Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    startTime: {
      type: String,
      required: true,
      match: /^([01]\d|2[0-3]):[0-5]\d$/,
    },
    endTime: {
      type: String,
      required: true,
      match: /^([01]\d|2[0-3]):[0-5]\d$/,
    },
    expectedMinutes: { type: Number, required: true, min: 1, max: 1440 },
    gracePeriodMinutes: { type: Number, default: 0, min: 0, max: 240 },
    crossesMidnight: { type: Boolean, default: false },
    active: { type: Boolean, default: true },
    processingWindowBeforeMinutes: { type: Number, default: 240 },
    processingWindowAfterMinutes: { type: Number, default: 240 },
  },
  { timestamps: true },
);
shiftSchema.pre("validate", function () {
  if (this.startTime && this.endTime)
    this.crossesMidnight = this.endTime <= this.startTime;
});
const employeeSchema = new Schema(
  {
    employeeId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    name: { type: String, required: true, trim: true },
    fatherName: String,
    designation: String,
    department: String,
    joiningDate: Date,
    phone: String,
    email: { type: String, lowercase: true, trim: true },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
    shiftId: { type: Schema.Types.ObjectId, ref: "Shift" },
    monthlySalary: { type: Number, min: 0, default: 0 },
    salaryCurrency: { type: String, enum: ["PKR", "USD"], default: "PKR" },
    payrollSettings,
    leavePolicy: {
      sickGranted: { type: Number, min: 0, default: 0 },
      casualGranted: { type: Number, min: 0, default: 0 },
    },
  },
  { timestamps: true },
);
const employeeAccountSchema = new Schema(
  {
    employee: { type: Schema.Types.ObjectId, ref: "Employee", required: true, unique: true, index: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, select: false },
    status: { type: String, enum: ["invited", "active", "disabled"], default: "invited" },
    inviteTokenHash: { type: String, select: false },
    inviteExpiresAt: { type: Date, select: false },
    resetTokenHash: { type: String, select: false },
    resetExpiresAt: { type: Date, select: false },
    passwordChangedAt: Date,
    failedLoginAttempts: { type: Number, default: 0 },
    lockedUntil: Date,
    lastLoginAt: Date,
  },
  { timestamps: true },
);
const importSchema = new Schema(
  {
    sourceFile: { type: String, required: true },
    fileHash: { type: String, required: true, unique: true, index: true },
    sheetName: String,
    mapping: Schema.Types.Mixed,
    status: {
      type: String,
      enum: ["uploaded", "processed", "failed"],
      default: "uploaded",
    },
    rawRecords: { type: Number, default: 0 },
    matchedEmployees: { type: Number, default: 0 },
    attendanceCreated: { type: Number, default: 0 },
    exceptions: { type: Number, default: 0 },
    duplicatePunches: { type: Number, default: 0 },
    importedBy: { type: Schema.Types.ObjectId, ref: "User" },
    error: String,
  },
  { timestamps: true },
);
const rawPunchSchema = new Schema(
  {
    employeeId: { type: String, required: true, index: true },
    employeeName: String,
    punchDate: String,
    punchTime: String,
    punchDateTime: { type: Date, required: true, index: true },
    originalType: String,
    sourceFile: String,
    importId: {
      type: Schema.Types.ObjectId,
      ref: "ImportBatch",
      required: true,
    },
    sourceRow: Number,
    rawData: { type: Schema.Types.Mixed, required: true },
    fingerprint: { type: String, required: true },
  },
  { timestamps: { createdAt: "importedAt", updatedAt: false } },
);
rawPunchSchema.index({ importId: 1, fingerprint: 1 }, { unique: true });
rawPunchSchema.index({ employeeId: 1, punchDateTime: 1 });
const attendanceSchema = new Schema(
  {
    employeeId: { type: String, required: true, index: true },
    employee: { type: Schema.Types.ObjectId, ref: "Employee", required: true },
    workDate: { type: String, required: true },
    shiftId: { type: Schema.Types.ObjectId, ref: "Shift", required: true },
    expectedClockIn: Date,
    expectedClockOut: Date,
    expectedMinutes: Number,
    actualClockIn: Date,
    actualClockOut: Date,
    actualMinutes: { type: Number, default: 0 },
    lateMinutes: { type: Number, default: 0 },
    earlyLeaveMinutes: { type: Number, default: 0 },
    shortMinutes: { type: Number, default: 0 },
    overtimeMinutes: { type: Number, default: 0 },
    conditions: [String],
    status: { type: String, default: "Present" },
    leaveType: { type: String, enum: ["sick", "casual", null], default: null },
    workflow: {
      type: String,
      enum: ["processed", "needs_review", "reviewed", "finalized"],
      default: "processed",
    },
    sourcePunchIds: [{ type: Schema.Types.ObjectId, ref: "RawPunch" }],
    manuallyAdjusted: { type: Boolean, default: false },
    adjustmentReason: String,
    finalizedAt: Date,
    finalizedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true },
);
attendanceSchema.index({ employeeId: 1, workDate: 1 }, { unique: true });
const adjustmentSchema = new Schema(
  {
    attendance: {
      type: Schema.Types.ObjectId,
      ref: "Attendance",
      required: true,
      index: true,
    },
    employeeId: String,
    workDate: String,
    changedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    before: Schema.Types.Mixed,
    after: Schema.Types.Mixed,
    reason: { type: String, required: true },
  },
  { timestamps: { createdAt: "changedAt", updatedAt: false } },
);
const exceptionSchema = new Schema(
  {
    type: { type: String, required: true, index: true },
    employeeId: String,
    employeeName: String,
    workDate: String,
    message: String,
    importId: { type: Schema.Types.ObjectId, ref: "ImportBatch" },
    attendance: { type: Schema.Types.ObjectId, ref: "Attendance" },
    sourceRow: Number,
    rawData: Schema.Types.Mixed,
    status: {
      type: String,
      enum: ["open", "resolved", "ignored"],
      default: "open",
    },
    resolution: String,
    resolvedBy: { type: Schema.Types.ObjectId, ref: "User" },
    resolvedAt: Date,
  },
  { timestamps: true },
);
const settingsSchema = new Schema(
  {
    key: { type: String, unique: true, default: "global" },
    companyName: { type: String, default: "BIZTEK PROFESSIONALS" },
    timezone: { type: String, default: "Asia/Karachi" },
    weekendDays: { type: [Number], default: [0, 6] },
    attendanceGrace: {
      mondayThursdayMinutes: { type: Number, default: 0, min: 0, max: 240 },
      fridayMinutes: { type: Number, default: 0, min: 0, max: 240 },
    },
    payroll: {
      salaryCalculationMethod: {
        type: String,
        default: "calendar-working-days",
      },
      workingDaysPerMonth: { type: Number, default: 26 },
      deductLateHours: { type: Boolean, default: false },
      deductShortHours: { type: Boolean, default: true },
      deductAbsences: { type: Boolean, default: true },
      payOvertime: { type: Boolean, default: false },
      roundingMinutes: { type: Number, default: 1 },
    },
  },
  { timestamps: true },
);
const holidaySchema = new Schema(
  {
    date: {
      type: String,
      required: true,
      unique: true,
      index: true,
      match: /^\d{4}-\d{2}-\d{2}$/,
    },
    name: { type: String, required: true, trim: true },
    description: String,
    active: { type: Boolean, default: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true },
);
const payslipEmailLogSchema = new Schema(
  {
    employee: { type: Schema.Types.ObjectId, ref: "Employee", required: true, index: true },
    employeeId: { type: String, required: true, index: true },
    recipient: { type: String, required: true, lowercase: true, trim: true },
    periodStart: { type: String, required: true },
    periodEnd: { type: String, required: true },
    status: { type: String, enum: ["sent", "failed"], required: true },
    messageId: String,
    error: String,
    sentBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: { createdAt: "attemptedAt", updatedAt: false } },
);
const publishedPayslipSchema = new Schema(
  {
    employee: { type: Schema.Types.ObjectId, ref: "Employee", required: true, index: true },
    employeeId: { type: String, required: true, index: true },
    periodStart: { type: String, required: true }, periodEnd: { type: String, required: true },
    currency: { type: String, enum: ["PKR", "USD"], required: true }, netSalary: { type: Number, required: true },
    data: { type: Schema.Types.Mixed, required: true, immutable: true }, templateVersion: { type: Number, default: 1, immutable: true },
    status: { type: String, enum: ["published", "void"], default: "published" },
    publishedBy: { type: Schema.Types.ObjectId, ref: "User", required: true }, publishedAt: { type: Date, default: Date.now },
    voidedBy: { type: Schema.Types.ObjectId, ref: "User" }, voidedAt: Date, voidReason: String,
    delivery: { status: { type: String, enum: ["pending", "sent", "failed"], default: "pending" }, attempts: { type: Number, default: 0 }, messageId: String, lastError: String, lastAttemptAt: Date },
  }, { timestamps: true },
);
publishedPayslipSchema.index({ employee: 1, periodStart: 1, periodEnd: 1 }, { unique: true, partialFilterExpression: { status: "published" } });
export const User = model("User", userSchema);
export const Shift = model("Shift", shiftSchema);
export const Employee = model("Employee", employeeSchema);
export const EmployeeAccount = model("EmployeeAccount", employeeAccountSchema);
export const ImportBatch = model("ImportBatch", importSchema);
export const RawPunch = model("RawPunch", rawPunchSchema);
export const Attendance = model("Attendance", attendanceSchema);
export const AttendanceAdjustment = model(
  "AttendanceAdjustment",
  adjustmentSchema,
);
export const AttendanceException = model(
  "AttendanceException",
  exceptionSchema,
);
export const Settings = model("Settings", settingsSchema);
export const Holiday = model("Holiday", holidaySchema);
export const PayslipEmailLog = model("PayslipEmailLog", payslipEmailLogSchema);
export const PublishedPayslip = model("PublishedPayslip", publishedPayslipSchema);

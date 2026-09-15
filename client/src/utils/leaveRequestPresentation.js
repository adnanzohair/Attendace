const typeLabels = { sick: "Sick Leave", casual: "Casual Leave", other: "Other Leave", unpaid: "Unpaid Leave" };
const statusLabels = { pending: "Pending", approved: "Approved", rejected: "Rejected" };

export const leaveTypeLabel = (value) => typeLabels[value] || "Leave";
export const leaveStatusLabel = (value) => statusLabels[value] || value || "—";

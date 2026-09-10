export function safeEmployee(employee) {
  return {
    employeeId: employee.employeeId,
    name: employee.name,
    email: employee.email,
    department: employee.department || "",
    designation: employee.designation || "",
    joiningDate: employee.joiningDate || null,
    phone: employee.phone || "",
  };
}

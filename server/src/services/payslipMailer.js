import nodemailer from "nodemailer";
import { readMailConfig } from "../config/mail.js";

export function createPayslipMailer({ env = process.env, createTransport = nodemailer.createTransport } = {}) {
  const config = readMailConfig(env);
  const transport = createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: { user: config.user, pass: config.appPassword },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 20000,
  });

  return {
    verify: () => transport.verify(),
    async send({ recipient, employeeName, period, pdf }) {
      if (!String(recipient || "").trim()) throw new Error("Employee has no stored email address");
      const start = period.startDate || "start";
      const end = period.endDate || "end";
      return transport.sendMail({
        from: { name: config.fromName, address: config.fromAddress },
        to: recipient,
        subject: `Payslip: ${start} to ${end}`,
        text: `Hello ${employeeName},\n\nPlease find your payslip for ${start} to ${end} attached.\n\nRegards,\n${config.fromName}`,
        attachments: [{
          filename: `payslip_${start}_${end}.pdf`,
          content: pdf,
          contentType: "application/pdf",
        }],
      });
    },
  };
}

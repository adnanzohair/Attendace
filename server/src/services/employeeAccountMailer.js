import nodemailer from "nodemailer";
import { readMailConfig } from "../config/mail.js";

export async function sendEmployeeAccountLink({
  recipient,
  employeeName,
  url,
  purpose,
}) {
  const config = readMailConfig();
  const transport = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: { user: config.user, pass: config.appPassword },
    connectionTimeout: 10000,
  });
  const activation = purpose === "activation";
  return transport.sendMail({
    from: { name: config.fromName, address: config.fromAddress },
    to: recipient,
    subject: activation
      ? "Activate your Attendly employee account"
      : "Reset your Attendly password",
    text: `Hello ${employeeName},\n\n${activation ? "Create your employee portal password" : "Reset your employee portal password"} using this secure link (valid for one hour):\n${url}\n\nIf you did not expect this email, ignore it.`,
  });
}

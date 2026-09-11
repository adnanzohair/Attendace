import nodemailer from "nodemailer";
import { readMailConfig } from "../config/mail.js";

export async function sendAdminInvitation({ recipient, name, url }) {
  const config = readMailConfig();
  const transport = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: { user: config.user, pass: config.appPassword },
    connectionTimeout: 10000,
  });
  return transport.sendMail({
    from: { name: config.fromName, address: config.fromAddress },
    to: recipient,
    subject: "Your Attendly administrator invitation",
    text: `Hello ${name},\n\nYou have been invited to administer Attendly. Create your password using this secure one-time link, valid for one hour:\n${url}\n\nIf you did not expect this invitation, ignore this email.`,
  });
}

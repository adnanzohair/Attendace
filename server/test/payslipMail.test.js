import test from "node:test";
import assert from "node:assert/strict";
import { createPayslipMailer } from "../src/services/payslipMailer.js";

const env = {
  SMTP_HOST: "smtp.gmail.com", SMTP_PORT: "465", SMTP_SECURE: "true",
  SMTP_USER: "adnan@tekglide.com", SMTP_APP_PASSWORD: "app-password",
  SMTP_FROM_NAME: "Tekglide HR",
};

test("sends a PDF only to the supplied stored employee email", async () => {
  let transportOptions;
  let message;
  const mailer = createPayslipMailer({
    env,
    createTransport(options) {
      transportOptions = options;
      return { sendMail: async (value) => { message = value; return { messageId: "m-1" }; } };
    },
  });
  const result = await mailer.send({
    recipient: "employee@example.com", employeeName: "Employee A",
    period: { startDate: "2026-07-25", endDate: "2026-08-25" },
    pdf: Buffer.from("%PDF-test"),
  });
  assert.equal(transportOptions.auth.user, "adnan@tekglide.com");
  assert.equal(message.to, "employee@example.com");
  assert.equal(message.attachments[0].contentType, "application/pdf");
  assert.match(message.attachments[0].filename, /2026-07-25_2026-08-25\.pdf$/);
  assert.equal(result.messageId, "m-1");
});

test("rejects an employee without a stored email", async () => {
  const mailer = createPayslipMailer({ env, createTransport: () => ({ sendMail: async () => ({}) }) });
  await assert.rejects(() => mailer.send({ recipient: "", employeeName: "A", period: {}, pdf: Buffer.alloc(1) }), /stored email/i);
});

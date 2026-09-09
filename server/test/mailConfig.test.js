import test from "node:test";
import assert from "node:assert/strict";

async function mailConfig() {
  try {
    return await import("../src/config/mail.js");
  } catch (error) {
    assert.fail(`Mail configuration module is unavailable: ${error.message}`);
  }
}

const validEnv = {
  SMTP_HOST: "smtp.gmail.com",
  SMTP_PORT: "465",
  SMTP_SECURE: "true",
  SMTP_USER: "adnan@tekglide.com",
  SMTP_APP_PASSWORD: "test-only-app-password",
  SMTP_FROM_NAME: "Tekglide HR",
};

test("normalizes a complete Gmail SMTP configuration", async () => {
  const { readMailConfig } = await mailConfig();
  assert.deepEqual(readMailConfig(validEnv), {
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    user: "adnan@tekglide.com",
    appPassword: "test-only-app-password",
    fromName: "Tekglide HR",
    fromAddress: "adnan@tekglide.com",
  });
});

test("rejects missing credentials and invalid ports", async () => {
  const { readMailConfig } = await mailConfig();
  assert.throws(() => readMailConfig({}), /SMTP is not configured/);
  assert.throws(
    () => readMailConfig({ ...validEnv, SMTP_PORT: "70000" }),
    /SMTP port/,
  );
});

test("public status never exposes the App Password", async () => {
  const { publicMailStatus } = await mailConfig();
  const status = publicMailStatus(validEnv);
  assert.deepEqual(status, {
    configured: true,
    sender: "adnan@tekglide.com",
  });
  assert.equal("appPassword" in status, false);
  assert.deepEqual(publicMailStatus({}), { configured: false, sender: null });
});

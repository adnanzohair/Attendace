function required(env, key) {
  const value = String(env[key] || "").trim();
  if (!value) throw new Error("SMTP is not configured");
  return value;
}

export function readMailConfig(env = process.env) {
  const host = required(env, "SMTP_HOST");
  const user = required(env, "SMTP_USER");
  const appPassword = required(env, "SMTP_APP_PASSWORD").replace(/\s+/g, "");
  const port = Number(required(env, "SMTP_PORT"));
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("SMTP port must be an integer from 1 to 65535");
  }
  return {
    host,
    port,
    secure: String(env.SMTP_SECURE || "true").toLowerCase() === "true",
    user,
    appPassword,
    fromName: String(env.SMTP_FROM_NAME || "Tekglide HR").trim(),
    fromAddress: user,
  };
}

export function publicMailStatus(env = process.env) {
  try {
    const config = readMailConfig(env);
    return { configured: true, sender: config.fromAddress };
  } catch {
    return { configured: false, sender: null };
  }
}

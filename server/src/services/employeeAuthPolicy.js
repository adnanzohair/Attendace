export const validPassword = (value) => typeof value === "string" && value.length >= 10;
export const tokenIsUsable = ({ expectedHash, actualHash, expiresAt, now = new Date() }) => Boolean(expectedHash && expectedHash === actualHash && expiresAt && new Date(expiresAt) > now);
export const employeeCookieOptions = (environment = process.env.NODE_ENV) => ({ httpOnly: true, sameSite: environment === "production" ? "none" : "lax", secure: environment === "production", maxAge: 28800000 });

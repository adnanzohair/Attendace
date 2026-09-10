import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("Vercel proxies API requests before applying the SPA fallback", async () => {
  const config = JSON.parse(await readFile(new URL("../vercel.json", import.meta.url), "utf8"));
  assert.equal(config.rewrites[0].source, "/api/:path*");
  assert.match(config.rewrites[0].destination, /^https:\/\//);
  assert.deepEqual(config.rewrites[1], { source: "/(.*)", destination: "/index.html" });
});

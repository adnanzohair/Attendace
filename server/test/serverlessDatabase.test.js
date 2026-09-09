import test from "node:test";
import assert from "node:assert/strict";
import { createDatabaseConnector, createDatabaseMiddleware } from "../src/config/db.js";

test("serverless database connector reuses one connection promise", async () => {
  let calls = 0;
  const client = {
    connection: { readyState: 0 },
    set() {},
    async connect(uri, options) {
      calls += 1;
      assert.equal(uri, "mongodb://example/attendance");
      assert.ok(options.serverSelectionTimeoutMS <= 8000);
      this.connection.readyState = 1;
      return { connection: { name: "attendance" } };
    },
  };
  const connect = createDatabaseConnector({ mongooseClient: client, env: { MONGODB_URI: "mongodb://example/attendance" } });
  await Promise.all([connect(), connect()]);
  await connect();
  assert.equal(calls, 1);
});

test("database middleware connects before continuing", async () => {
  let connected = false, continued = false;
  const middleware = createDatabaseMiddleware(async () => { connected = true; });
  await middleware({}, {}, () => { continued = true; });
  assert.equal(connected, true);
  assert.equal(continued, true);
});

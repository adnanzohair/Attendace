import test from "node:test";
import assert from "node:assert/strict";
import { FOOTER_COPY } from "../src/components/footerContent.js";

test("uses the approved professional footer credit", () => {
  assert.equal(FOOTER_COPY, "Attendly — Thoughtfully designed and engineered by Adnan");
});

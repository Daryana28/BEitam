import assert from "node:assert/strict";
import { test } from "node:test";
import { getFileSharingOverview } from "./fileSharingController.js";

test("drive monitoring handles real capacity, missing paths and invalid configuration", async () => {
  const original = process.env.FILE_SHARING_DRIVES;
  const run = async (config) => {
    process.env.FILE_SHARING_DRIVES = JSON.stringify(config);
    let status = 200;
    let body;
    await getFileSharingOverview({}, {
      status(value) { status = value; return this; },
      json(value) { body = value; return this; },
    });
    return { status, body };
  };
  try {
    assert.deepEqual((await run([])).body.drives, []);
    const { body } = await run([{ path: process.cwd(), name: "Test volume" }]);
    assert.equal(body.drives[0].status, "online");
    assert.ok(body.drives[0].totalBytes > 0);
    assert.equal(body.drives[0].totalBytes, body.drives[0].usedBytes + body.drives[0].freeBytes);
    const missing = await run([{ path: `${process.cwd()}/nonexistent-drive-monitoring-test` }]);
    assert.equal(missing.body.drives[0].status, "unavailable");
    assert.equal(missing.body.drives[0].totalBytes, undefined);
    assert.equal((await run([{ path: "relative" }])).status, 500);
    assert.equal((await run({ path: process.cwd() })).status, 500);
  } finally {
    if (original === undefined) delete process.env.FILE_SHARING_DRIVES;
    else process.env.FILE_SHARING_DRIVES = original;
  }
});

// tracker/tests/test_lock.js
const { acquireLock, releaseLock } = require("../utils/lock");

console.log("🔹 First attempt: acquiring lock...");
const first = acquireLock();
console.log("Result:", first);

console.log("🔹 Second attempt (should fail)...");
const second = acquireLock();
console.log("Result:", second);

console.log("🔹 Releasing lock...");
releaseLock();

console.log("🔹 Third attempt after release (should succeed again)...");
const third = acquireLock();
console.log("Result:", third);

releaseLock();
console.log("✅ Lock test completed.");

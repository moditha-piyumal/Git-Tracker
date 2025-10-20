// tracker/tests/test_logger.js
const log = require("../utils/logger");

log.section("Logger Test Run");
log.info("This is an informational message.");
log.warn("This is a warning message.");
log.error("This is an error message.");
console.log("✅ Logger test finished. Check the data/logs folder!");

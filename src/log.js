module.exports = require("pino")({
  enabled: process.env.NODE_ENV !== "test"
});

const log = require("./log");

const DEFAULT_TOKEN = "sec3tt0k3n" + Math.random();
const TOKEN = process.env.TOKEN || DEFAULT_TOKEN;

module.exports = (req, res, next) => {
  if (!req.headers.authorization && req.headers.authorization !== TOKEN) {
    res.status(403).json({ error: "Invalid credentials" });
    log.error(new Error("Invalid credentials"));
    // todo: sentry
    return;
  }
  next();
};

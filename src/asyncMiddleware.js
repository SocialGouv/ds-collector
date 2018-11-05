const log = require("./log");

// catch all errors
module.exports = fn => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(e => {
    log.error(e);
    next(e);
  });
};

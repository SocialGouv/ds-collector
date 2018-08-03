//@flow
const pino = require("pino")({
  enabled: process.env.NODE_ENV !== "test"
});
const Datastore = require("nedb");

const PERSISTENT_PATH =
  process.env.NODE_ENV === "test" ? "./data-test.nedb" : "./data-prod.nedb";

pino.info(`Restoring database at ${PERSISTENT_PATH}`);
const db = new Datastore({ filename: PERSISTENT_PATH, autoload: true });

const findOne = (filters /*: Object */ = {}) =>
  new Promise((resolve, reject) => {
    db.findOne(filters, function(err, doc) {
      if (err) {
        return reject(err);
      }
      resolve(doc);
    });
  });

const insert = (data /*: Object */) =>
  new Promise((resolve, reject) =>
    db.insert(data, (err, doc) => {
      if (err) {
        return reject(err);
      }
      resolve(doc);
    })
  );

const update = (filters /*: Object */, data /*: Object */) =>
  new Promise((resolve, reject) =>
    db.update(filters, data, {}, (err, doc) => {
      if (err) {
        return reject(err);
      }
      resolve(doc);
    })
  );

const dump = () =>
  new Promise((resolve, reject) =>
    db.find({}, (err, docs) => {
      if (err) {
        return reject(err);
      }
      return resolve(docs);
    })
  );

const clear = () =>
  new Promise((resolve, reject) =>
    db.remove({}, { multi: true }, function(err, numRemoved) {
      if (err) {
        return reject(err);
      }
      return resolve(numRemoved);
    })
  );

module.exports = {
  insert,
  findOne,
  dump,
  clear,
  update
};

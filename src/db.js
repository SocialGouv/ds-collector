//@flow
const Datastore = require("nedb");

const log = require("./log");

if (!process.env.DS_ID_PROCEDURE) {
  throw new Error("process.env.DS_ID_PROCEDURE not found");
}

const DB_PATH = `data/${process.env.DS_ID_PROCEDURE}.nedb`;

log.info(`Restoring database at ${DB_PATH}`);

const db = new Datastore({ filename: DB_PATH, autoload: true });

const find = (filters /*: Object */ = {}, sort /*: Object */ = {}) =>
  new Promise((resolve, reject) => {
    db.find(filters)
      .sort(sort)
      .exec((err, doc) => {
        if (err) {
          return reject(err);
        }
        resolve(doc);
      });
  });

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
  clear,
  dump,
  find,
  findOne,
  insert,
  update
};

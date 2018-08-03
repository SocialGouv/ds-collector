//@flow
const pino = require("pino")({
  enabled: process.env.NODE_ENV !== "test"
});
const fetch = require("node-fetch");
const { isBefore, parse } = require("date-fns");
const { findOne, insert, update } = require("./db");
const serialExec = require("promise-serial-exec");

const range = (length /*: number */) => Array.from({ length }, (_, v) => v);
const flatten = (arr /*: Array<any> */) /*: Array<any> */ =>
  arr.reduce((a, c) => [...a, ...c], []);

const DS_API_URL =
  process.env.DS_API_URL || "https://www.demarches-simplifiees.fr";
const DS_ID_PROCEDURE = process.env.DS_ID_PROCEDURE || 1;
const DS_TOKEN = process.env.DS_TOKEN || "invalidToken";

// ---------- single dossier
const getDossierUrl = (id /*: number */) /*: string */ =>
  `${DS_API_URL}/api/v1/procedures/${DS_ID_PROCEDURE}/dossiers/${id}?token=${DS_TOKEN}`;

const fetchDossier = (id /*: number */) /*: Promise<Object> */ => {
  pino.info(`ds-api: fetchDossier ${id}`);
  return fetch(getDossierUrl(id)).then(res => res.json());
};

// ---------- all dossiers
const getDossiersUrl = (page /*: number */ = 1) /*: string */ =>
  `${DS_API_URL}/api/v1/procedures/${DS_ID_PROCEDURE}/dossiers?token=${DS_TOKEN}&resultats_par_page=1000&page=${page}`;

const fetchDossiers = (page /*: number */ = 1) /*: Promise<Object> */ => {
  pino.info(`ds-api: fetchDossiers page ${page}`);
  return fetch(getDossiersUrl(page)).then(res => res.json());
};

const getAllDossiers = async () => {
  pino.info(`ds-api: getAllDossiers`);
  const firstPage = await fetchDossiers(1);
  const nbPages = firstPage.pagination.nombre_de_page;
  if (nbPages > 1) {
    const nextPages = await serialExec(
      range(nbPages - 1).map(i => () =>
        fetchDossiers(i + 2).then(data => data.dossiers)
      )
    );
    return [...firstPage.dossiers, ...flatten(nextPages)];
  }
  return firstPage.dossiers;
};

const isOutDated = (date1, date2) => isBefore(parse(date1), parse(date2));

// check if a local dossier needs update
const updateDossierLocal = async ({ id, updated_at }) => {
  pino.info(`ds-api: updateDossierLocal`);
  const dossierLocal = await findOne({ "dossier.id": id });
  if (!dossierLocal) {
    const dossierRemote = await fetchDossier(id);
    pino.info(`ds-api: CREATE dossier ${id}`);
    return insert(dossierRemote);
  } else if (isOutDated(dossierLocal.dossier.updated_at, updated_at)) {
    const dossierRemote = await fetchDossier(id);
    pino.info(`ds-api: UPDATE dossier ${id}`);
    return update({ "dossier.id": id }, dossierRemote);
  }
  // dossier didnt change, skip
  return Promise.resolve();
};

// rescan all dossiers for udpate
const rescan = async () => {
  pino.info(`ds-api: rescan`);
  const dossiers = await getAllDossiers();
  return serialExec(
    dossiers.map(dossier => () =>
      updateDossierLocal({
        id: dossier.id,
        updated_at: dossier.updated_at
      })
    )
  );
};

module.exports = {
  fetchDossier,
  fetchDossiers,
  getAllDossiers,
  rescan,
  updateDossierLocal
};

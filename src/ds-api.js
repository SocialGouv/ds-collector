//@flow

const fetch = require("node-fetch");

const range = (length /*: number */) => Array.from({ length }, (_, v) => v);
const flatten = (arr /*: Array<any> */) /*: Array<any> */ =>
  arr.reduce((a, c) => [...a, ...c], []);

const DS_API_URL = process.env.DS_API_URL || "http://test";
const DS_ID_PROCEDURE = process.env.DS_ID_PROCEDURE || 1;
const DS_TOKEN = process.env.DS_TOKEN || "invalidToken";

// ---------- single dossier
const getDossierUrl = (id /*: number */) /*: string */ =>
  `${DS_API_URL}/api/v1/procedures/${DS_ID_PROCEDURE}/dossiers/${id}?token=${DS_TOKEN}`;

const fetchDossier = (id /*: number */) /*: Promise<Object> */ =>
  fetch(getDossierUrl(id)).then(res => res.json());

// ---------- all dossiers
const getDossiersUrl = (page /*: number */ = 1) /*: string */ =>
  `${DS_API_URL}/api/v1/procedures/${DS_ID_PROCEDURE}/dossiers?token=${DS_TOKEN}&resultats_par_page=1000&page=${page}`;

const fetchDossiers = (page /*: number */ = 1) /*: Promise<Object> */ =>
  fetch(getDossiersUrl(page)).then(res => res.json());

const getAllDossiers = async () => {
  const firstPage = await fetchDossiers(1);
  const nbPages = firstPage.pagination.nombre_de_page;
  if (nbPages > 1) {
    const nextPages = await Promise.all(
      range(nbPages - 1).map(i =>
        fetchDossiers(i + 2).then(data => data.dossiers)
      )
    );
    return [...firstPage.dossiers, ...flatten(nextPages)];
  }
  return firstPage.dossiers;
};

const rescan = async () => {
  const dossiers = await getAllDossiers();

  // check existe id + check updated_at + logging
};

getDossiersUrl(2);

module.exports = {
  fetchDossier,
  fetchDossiers,
  getAllDossiers
};

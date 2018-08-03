// @flow

const { insert, findOne, update } = require("./db");
const { fetchDossier } = require("./ds-api");
const { isBefore, parse } = require("date-fns");
/*::

type DsState = "CLOSED" | "OPENED";

type WebhookInput = {
  procedure_id: number,
  dossier_id: number,
  state: DsState,
  updated_at: Date
};

type WebhookResult = {
  message: string
};

*/

/**
 * @param {number} a
 * @param {number} b
 * @return {number}
 */

const isOutDated = (date1, date2) => isBefore(parse(date1), parse(date2));

const webhookHandler = async (
  payload /*: WebhookInput */
) /*: Promise<WebhookResult> */ => {
  const { procedure_id, dossier_id, state, updated_at } = payload;
  const dossierLocal = await findOne({ "dossier.id": dossier_id });
  if (!dossierLocal) {
    const dossierRemote = await fetchDossier(dossier_id);
    const ins = await insert(dossierRemote);
  } else if (isOutDated(dossierLocal.dossier.updated_at, updated_at)) {
    const dossierRemote = await fetchDossier(dossier_id);
    const updt = await update({ "dossier.id": dossier_id }, dossierRemote);
  } else {
    // dossier didnt change, skip
  }
  return { success: true, message: "ok" };
};

module.exports = webhookHandler;

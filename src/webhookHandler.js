// @flow

const { insert, findOne, update } = require("./db");
const { updateDossierLocal } = require("./ds-api");
const log = require("./log");

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
const webhookHandler = async (
  payload /*: WebhookInput */
) /*: Promise<WebhookResult> */ => {
  const { procedure_id, dossier_id, state, updated_at } = payload;
  const updated = await updateDossierLocal({
    id: dossier_id,
    updated_at
  });
  return { success: true, message: "ok" };
};

module.exports = webhookHandler;

// @flow

const { updateDossierLocal } = require("./ds-api");

/*::

type DsState = "brouillon" | "en_construction" | "en_instruction" | "accepte" | "refuse" | "sans_suite"

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
  const { dossier_id, updated_at } = payload;
  await updateDossierLocal({
    id: dossier_id,
    updated_at
  });
  return { success: true, message: "ok" };
};

module.exports = webhookHandler;

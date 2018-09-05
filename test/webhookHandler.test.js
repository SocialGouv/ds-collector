//@flow

const fetch = require("node-fetch");

process.env.DS_API_URL = "http://fakeApi.com";
process.env.DS_ID_PROCEDURE = "4222";

const webhookHandler = require("../src/webhookHandler");
const { findOne, clear, insert } = require("../src/db");

const SAMPLE_DOSSIER = {
  dossier: {
    id: "dossier-test-1",
    nom_projet: "Projet 12345",
    description: "Ma super description 12345",
    created_at: "2008-09-01T08:05:00.000Z",
    updated_at: "2008-09-01T08:05:00.000Z"
  }
};

const SAMPLE_DOSSIER_UPDATED = {
  dossier: {
    id: "dossier-test-2",
    nom_projet: "Projet 12345",
    description: "Ma super description 12345",
    created_at: "2018-09-01T08:05:00.000Z",
    updated_at: "2018-09-01T08:05:00.000Z"
  }
};

const SAMPLE_DOSSIER_OUTDATED = {
  dossier: {
    id: "dossier-test-2",
    nom_projet: "Projet 12345",
    description: "Ma super description 12345",
    created_at: "2008-09-01T08:05:00.000Z",
    updated_at: "2008-09-01T08:05:00.000Z"
  }
};

const SAMPLE_WEBHOOK_POST = {
  dossier_id: "dossier-test-1",
  procedure_id: 123,
  state: "CLOSED",
  updated_at: new Date()
};

describe("webhookHandler", () => {
  beforeEach(() => {
    fetch.resetMocks();
    clear();
  });
  it("should fetch and save the dossier if doesnt exists locally", async () => {
    fetch.mockResponse(JSON.stringify(SAMPLE_DOSSIER));
    const exists = await findOne({
      "dossier.id": "dossier-test-1"
    });
    expect(exists).toBeNull();
    await webhookHandler({
      dossier_id: "dossier-test-1",
      hello: "world"
    });
    expect(fetch.mock.calls.length).toEqual(1);
    expect(fetch.mock.calls[0][0]).toEqual(
      "http://fakeApi.com/api/v1/procedures/4222/dossiers/dossier-test-1?token=invalidToken"
    );
    const created = await findOne({
      "dossier.id": "dossier-test-1"
    });
    expect(created).not.toBeNull();
    expect.assertions(4);
  });

  it("should NOT refetch the dossier if exists locally and not outdated", async () => {
    const exists = await findOne({
      "dossier.id": "dossier-test-1"
    });
    expect(exists).toBeNull();
    const ins = await insert(SAMPLE_DOSSIER);
    const created1 = await findOne({
      "dossier.id": "dossier-test-1"
    });
    expect(created1).not.toBeNull();
    fetch.mockResponse(JSON.stringify(SAMPLE_DOSSIER));
    await webhookHandler({
      dossier_id: "dossier-test-1",
      hello: "world"
    });
    expect(fetch.mock.calls.length).toEqual(0);
    const created2 = await findOne({
      "dossier.id": "dossier-test-1"
    });
    expect(created2).not.toBeNull();
    expect.assertions(4);
  });

  it("should refetch and save the dossier if exists locally but outdated", async () => {
    const exists = await findOne({
      "dossier.id": "dossier-test-2"
    });
    expect(exists).toBeNull();
    const ins = await insert(SAMPLE_DOSSIER_OUTDATED);
    const exists2 = await findOne({
      "dossier.id": "dossier-test-2"
    });
    expect(exists2).not.toBeNull();
    fetch.mockResponse(JSON.stringify(SAMPLE_DOSSIER_UPDATED));
    await webhookHandler({
      dossier_id: "dossier-test-2",
      updated_at: "2018-09-01T08:05:00.000Z"
    });
    expect(fetch.mock.calls.length).toEqual(1);
    const created2 = await findOne({
      "dossier.id": "dossier-test-2"
    });
    expect(created2).not.toBeNull();
    expect(created2.dossier.updated_at).toEqual("2018-09-01T08:05:00.000Z");
    expect.assertions(5);
  });
});

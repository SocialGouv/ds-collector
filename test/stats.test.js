process.env.DS_API_URL = "http://fakeApi.com";
process.env.DS_ID_PROCEDURE = "4212";

const { insert, find, clear } = require("../src/db");
const { getStats, aggregate } = require("../src/stats");

const SAMPLE_DOSSIERS = [
  {
    dossier: {
      id: 1,
      created_at: "2018-05-17T12:00:21.005Z",
      updated_at: "2018-06-09T13:43:59.462Z",
      processed_at: "2008-09-01T10:05:00.000Z",
      initiated_at: "2008-05-01T10:05:00.000Z",
      state: "closed",
      champs: [
        {
          value: "hello",
          type_de_champ: {
            libelle: "answer"
          }
        }
      ]
    }
  },
  {
    dossier: {
      id: 2,
      created_at: "2018-02-12T12:00:21.005Z",
      updated_at: "2018-03-09T13:43:59.462Z",
      processed_at: "2008-09-01T10:05:00.000Z",
      initiated_at: "2008-05-01T10:05:00.000Z",
      state: "refused",
      champs: [
        {
          value: "hello2",
          type_de_champ: {
            libelle: "answer"
          }
        }
      ]
    }
  },
  {
    dossier: {
      id: 3,
      created_at: "2018-01-17T12:00:21.005Z",
      updated_at: "2018-02-09T13:43:59.462Z",
      processed_at: "2008-09-01T10:05:00.000Z",
      initiated_at: "2008-05-01T10:05:00.000Z",
      state: "closed",
      champs: [
        {
          value: "hello2",
          type_de_champ: {
            libelle: "answer"
          }
        }
      ]
    }
  },
  {
    dossier: {
      id: 4,
      created_at: "2018-01-17T12:00:21.005Z",
      updated_at: "2018-04-09T13:43:59.462Z",
      processed_at: "2008-09-01T10:05:00.000Z",
      initiated_at: "2008-05-01T10:05:00.000Z",
      state: "refused",
      champs: [
        {
          value: "hello",
          type_de_champ: {
            libelle: "answer"
          }
        }
      ]
    }
  },
  {
    dossier: {
      id: 5,
      created_at: "2018-05-01T12:00:21.005Z",
      updated_at: "2018-06-09T13:43:59.462Z",
      processed_at: "2008-09-01T10:05:00.000Z",
      initiated_at: "2008-05-01T10:05:00.000Z",
      state: "closed",
      champs: [
        {
          value: "hello",
          type_de_champ: {
            libelle: "answer"
          }
        }
      ]
    }
  },
  {
    dossier: {
      id: 6,
      created_at: "2018-05-02T12:00:21.005Z",
      updated_at: "2018-07-10T13:43:59.462Z",
      processed_at: "2008-09-01T10:05:00.000Z",
      initiated_at: "2008-05-01T10:05:00.000Z",
      state: "closed",
      champs: [
        {
          value: "hello",
          type_de_champ: {
            libelle: "answer"
          }
        }
      ]
    }
  },
  {
    dossier: {
      id: 7,
      created_at: "2018-02-21T12:00:21.005Z",
      updated_at: "2018-03-09T13:43:59.462Z",
      processed_at: "2008-09-01T10:05:00.000Z",
      initiated_at: "2008-05-01T10:05:00.000Z",
      state: "without_continuation",
      champs: [
        {
          value: "hello3",
          type_de_champ: {
            libelle: "answer"
          }
        }
      ]
    }
  },
  {
    dossier: {
      id: 8,
      created_at: "2018-03-27T12:00:21.005Z",
      updated_at: "2018-04-09T13:43:59.462Z",
      processed_at: "2008-09-01T10:05:00.000Z",
      initiated_at: "2008-05-01T10:05:00.000Z",
      state: "without_continuation",
      champs: [
        {
          value: "hello2",
          type_de_champ: {
            libelle: "answer"
          }
        }
      ]
    }
  },
  {
    dossier: {
      id: 9,
      created_at: "2017-01-17T12:00:21.005Z",
      updated_at: "2017-02-09T13:43:59.462Z",
      processed_at: "2008-09-01T10:05:00.000Z",
      initiated_at: "2008-05-01T10:05:00.000Z",
      state: "draft",
      champs: [
        {
          value: "hello2",
          type_de_champ: {
            libelle: "answer"
          }
        }
      ]
    }
  },
  {
    dossier: {
      id: 10,
      created_at: "2017-05-07T12:00:21.005Z",
      updated_at: "2018-07-09T13:43:59.462Z",
      processed_at: "2008-09-01T10:05:00.000Z",
      initiated_at: "2008-05-01T10:05:00.000Z",
      state: "closed",
      champs: [
        {
          value: "hello",
          type_de_champ: {
            libelle: "answer"
          }
        }
      ]
    }
  }
];
describe("stats", () => {
  beforeEach(() => {
    clear();
  });
  describe("getStats", () => {
    it("should compute correct stats", async () => {
      SAMPLE_DOSSIERS.forEach(dossier => insert(dossier));
      const docs = await find({}, { "dossier.id": 1 }); // sort results to get consistent snapshots
      const stats = getStats(docs);
      expect(stats).toMatchSnapshot();
    });
    it("should return aggregated libelle values", async () => {
      SAMPLE_DOSSIERS.forEach(dossier => insert(dossier));
      const docs = await find({}, { "dossier.id": 1 }); // sort results to get consistent snapshots
      const agg = aggregate(docs, "answer");
      expect(agg).toMatchSnapshot();
    });
  });
});

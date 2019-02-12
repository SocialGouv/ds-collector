import { clear, find, insert } from "../src/db";
import { aggregate, getStats } from "../src/stats";
import SAMPLE_DOSSIERS from "./__fixtures__/dossiers.json";

process.env.DS_API_URL = "http://fakeApi.com";
process.env.DS_ID_PROCEDURE = "4212";

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

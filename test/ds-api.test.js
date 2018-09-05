//@flow

const fetch = require("node-fetch");

process.env.DS_API_URL = "http://fakeApi.com";
process.env.DS_ID_PROCEDURE = "4212";

const {
  fetchDossier,
  fetchDossiers,
  getAllDossiers,
  rescan
} = require("../src/ds-api");

const { insert, clear } = require("../src/db");

const fakeDossiers = {
  pagination: {
    page: 1,
    resultats_par_page: 25,
    nombre_de_page: 1
  },
  dossiers: [
    {
      id: 1
    },
    {
      id: 2
    },
    {
      id: 3
    },
    {
      id: 4
    },
    {
      id: 5
    }
  ]
};

const fakeDossiers2pages = {
  pagination: {
    page: 1,
    resultats_par_page: 25,
    nombre_de_page: 2
  },
  dossiers: [
    {
      id: 1,
      updated_at: "2008-09-01T08:05:00.000Z"
    },
    {
      id: 2,
      updated_at: "2018-09-01T08:05:00.000Z"
    },
    {
      id: 3,
      updated_at: "2018-09-01T08:05:00.000Z"
    },
    {
      id: 4,
      updated_at: "2008-09-01T08:05:00.000Z"
    },
    {
      id: 5,
      updated_at: "2018-09-01T08:05:00.000Z"
    }
  ]
};

const SAMPLE_DOSSIER_UPDATED1 = {
  dossier: {
    id: 2,
    updated_at: "2018-09-01T08:05:00.000Z"
  }
};

const SAMPLE_DOSSIER_UPDATED2 = {
  dossier: {
    id: 5,
    updated_at: "2018-12-01T08:05:00.000Z"
  }
};

const fakeDossier = {
  dossier: 42
};

describe("ds-api", () => {
  beforeEach(() => {
    fetch.resetMocks();
    clear();
  });
  describe("ds api calls", () => {
    it("fetchDossier: should use correct url and use process.env", async () => {
      fetch.mockResponse(JSON.stringify(fakeDossier));
      const dossier = await fetchDossier(123);
      expect(dossier).toMatchSnapshot();
      expect(fetch.mock.calls[0][0]).toEqual(
        "http://fakeApi.com/api/v1/procedures/4212/dossiers/123?token=invalidToken"
      );
      expect.assertions(2);
    });
    it("fetchDossiers: should use correct url and use process.env", async () => {
      fetch.mockResponse(JSON.stringify(fakeDossiers));
      const dossiers = await fetchDossiers();
      expect(dossiers).toMatchSnapshot();
      expect(fetch.mock.calls[0][0]).toEqual(
        "http://fakeApi.com/api/v1/procedures/4212/dossiers?token=invalidToken&resultats_par_page=1000&page=1"
      );
      expect.assertions(2);
    });
    it("getAllDossiers: should make a single call when single page", async () => {
      fetch.mockResponse(JSON.stringify(fakeDossiers));
      const dossiers = await getAllDossiers();
      expect(dossiers).toMatchSnapshot();
      expect(fetch.mock.calls.length).toEqual(1);
      expect(fetch.mock.calls[0][0]).toEqual(
        "http://fakeApi.com/api/v1/procedures/4212/dossiers?token=invalidToken&resultats_par_page=1000&page=1"
      );
      expect.assertions(3);
    });
    it("getAllDossiers: should make multiple calls when multiple page", async () => {
      fetch.mockResponse(
        JSON.stringify({
          ...fakeDossiers,
          pagination: {
            ...fakeDossiers.pagination,
            nombre_de_page: 8
          }
        })
      );
      const dossiers = await getAllDossiers();
      expect(dossiers).toMatchSnapshot();
      expect(fetch.mock.calls.length).toEqual(8);
      expect(fetch.mock.calls[0][0]).toEqual(
        "http://fakeApi.com/api/v1/procedures/4212/dossiers?token=invalidToken&resultats_par_page=1000&page=1"
      );
      expect(fetch.mock.calls[7][0]).toEqual(
        "http://fakeApi.com/api/v1/procedures/4212/dossiers?token=invalidToken&resultats_par_page=1000&page=8"
      );
      expect.assertions(4);
    });
  });
  describe("rescan", () => {
    it("should fetch all unknown dossiers", async () => {
      fetch.mockResponse(JSON.stringify(fakeDossiers2pages));
      const res = await rescan();
      expect(fetch.mock.calls.length).toEqual(12);
    });
    it("should NOT fetch existing and updated dossiers", async () => {
      await insert(SAMPLE_DOSSIER_UPDATED1);
      await insert(SAMPLE_DOSSIER_UPDATED2);
      fetch.mockResponse(JSON.stringify(fakeDossiers2pages));
      const res = await rescan();
      expect(fetch.mock.calls.length).toEqual(8);
    });
  });
});

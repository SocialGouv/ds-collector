//@flow

const fetch = require("node-fetch");
jest.setMock("node-fetch", fetch);

process.env.DS_API_URL = "http://fakeApi.com";
process.env.DS_ID_PROCEDURE = "4212";

const {
  fetchDossier,
  fetchDossiers,
  getAllDossiers
} = require("../src/ds-api");

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

const fakeDossier = {
  dossier: 42
};

describe("ds-api", () => {
  describe("ds api calls", () => {
    beforeEach(() => {
      fetch.resetMocks();
    });
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
});

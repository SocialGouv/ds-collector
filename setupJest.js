process.env.DS_API_URL = "http://fakeApi.com";
process.env.DS_ID_PROCEDURE = "4212";

const fetch = require("jest-fetch-mock");
jest.setMock("node-fetch", fetch);

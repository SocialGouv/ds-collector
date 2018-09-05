const swaggerJSDoc = require("swagger-jsdoc");

const pkg = require("../package.json");

const openApiData = require("../openapi.json");

const getOpenApiDoc = () => {
  openApiData.definition.info.version = pkg.version;
  return swaggerJSDoc(openApiData);
};

module.exports = getOpenApiDoc;

if (require.main === module) {
  console.log(JSON.stringify(getOpenApiDoc(), null, 2));
}

// @flow
const express = require("express");
const bodyParser = require("body-parser");
const swaggerJSDoc = require("swagger-jsdoc");
const cors = require("cors");
const { format, subMonths } = require("date-fns");

const openapiData = require("../openapi.json");
const pkg = require("../package.json");
const log = require("./log");
const { find, insert, dump } = require("./db");
const { getStats, aggregate } = require("./stats");
const { rescan } = require("./ds-api");
const webhookHandler = require("./webhookHandler");
const asyncMiddleware = require("./asyncMiddleware");

const app = express();
app.use(bodyParser.json());
app.use(cors());

// for API documentation
app.get("/doc/api-docs.json", function(req, res) {
  openapiData.definition.info.version = pkg.version;
  res.setHeader("Content-Type", "application/json");
  res.send(swaggerJSDoc(openapiData));
});

app.use("/doc", express.static("./doc"));

/**
 * @swagger
 * components:
 *   requestBodies:
 *     WebhookInput:
 *       description: A JSON object containing webhook input data
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/WebhookInput'
 *   schemas:
 *     WebhookInput:
 *       description: webhook input data
 *       type: object
 *       properties:
 *         procedure_id:
 *           type: number
 *           example: 4212
 *         dossier_id:
 *           type: number
 *           example: 2873
 *         state:
 *           type: string
 *           enum: [draft, initiated, received, closed, refused, without_continuation]
 *         updated_at:
 *           type: string
 *           format: date-time
 *           example: "2018-01-01T09:00:00Z"
 *     SuccessResponse:
 *       description: réponse générique
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           value: true
 *         result:
 *           oneOf:
 *             - type: array
 *             - type: object
 *     AggregateResponse:
 *       description: aggregation data response
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           value: true
 *         result:
 *           type: object
 *
 * @swagger
 * /webhook:
 *   post:
 *     description: DS webhook endpoint
 *     requestBody:
 *       $ref: '#/components/requestBodies/WebhookInput'
 *     produces:
 *       - application/json
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 */
app.post(
  "/webhook",
  asyncMiddleware(async (req, res, next) => {
    log.info("POST /webhook", req.body);
    const result = await webhookHandler(req.body);
    res.json({ success: true, result });
    next();
  })
);

// todo: secure to prevent DoS
/**
 * @swagger
 * /rescan:
 *   get:
 *     description: rescan and fetch missing dossiers from DS API
 *     produces:
 *       - application/json
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 */
app.get(
  "/rescan",
  asyncMiddleware(async (req, res, next) => {
    log.info("GET /rescan");
    const result = await rescan();
    res.json({ success: true, result });
    next();
  })
);

// todo: validate + sanitize input
/**
 * @swagger
 * /stats:
 *   get:
 *     description: fetch global stats
 *     produces:
 *       - application/json
 *     parameters:
 *       - in: query
 *         name: from
 *         description: return stats for dossiers starting from this date.
 *         required: false
 *         schema:
 *           type: string
 *         example: "2017-01-01"
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 */
app.get(
  "/stats",
  asyncMiddleware(async (req, res, next) => {
    log.info("GET /stats");
    const sixMonthsAgo = format(subMonths(new Date(), 6));
    const startDate = req.query.from || sixMonthsAgo;
    const docs = await find(
      { "dossier.created_at": { $gte: startDate } },
      { "dossier.created_at": 1 }
    );
    res.json({ success: true, result: getStats(docs) });
    next();
  })
);

/**
 * @swagger
 * /aggregate:
 *   get:
 *     description: get aggregated stats for a given champ libelle
 *     produces:
 *       - application/json
 *     parameters:
 *       - in: query
 *         name: filters
 *         description: filters to apply to the query
 *         required: false
 *         schema:
 *           type: string
 *           example: "{%22dossier.created_at%22:{%22$gte%22:%222018-05-01%22}}"
 *       - in: query
 *         name: sort
 *         description: sort to apply to the query
 *         required: false
 *         schema:
 *           type: string
 *           example: "{%22dossier.created_at%22:1}"
 *       - in: query
 *         name: libelle
 *         description: libelle of the field to aggregate
 *         required: true
 *         schema:
 *           type: string
 *           example: Nationalité
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AggregateResponse'
 */
app.get(
  "/aggregate",
  asyncMiddleware(async (req, res, next) => {
    log.info("GET /aggregate");
    const docs = await find(
      req.query.filters ? JSON.parse(req.query.filters) : {},
      req.query.sort ? JSON.parse(req.query.sort) : {}
    );
    res.json({ success: true, result: aggregate(docs, req.query.libelle) });
    next();
  })
);

// todo: validate + sanitize input
/**
 * @swagger
 * /dump:
 *   get:
 *     description: dump all dossiers data
 *     produces:
 *       - application/json
 *     parameters:
 *       - in: query
 *         name: filters
 *         description: filters to apply to the query
 *         required: false
 *         schema:
 *           type: string
 *           example: "{%22dossier.created_at%22:{%22$gte%22:%222018-05-01%22}}"
 *       - in: query
 *         name: sort
 *         description: sort to apply to the query
 *         required: false
 *         schema:
 *           type: string
 *           example: "{%22dossier.created_at%22:1}"
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 */
app.get(
  "/dump",
  asyncMiddleware(async (req, res, next) => {
    log.info("GET /dump");
    const docs = await find(
      req.query.filters ? JSON.parse(req.query.filters) : {},
      req.query.sort ? JSON.parse(req.query.sort) : {}
    );
    res.json({ success: true, result: docs });
    next();
  })
);

/*
 * @swagger
 * /:
 *   get:
 *     description: get API version
 *     produces:
 *       - application/json
 */
app.get("/", (req, res, next) => {
  log.info("GET /");
  res.json({
    success: true,
    version: pkg.version,
    NODE_ENV: process.env.NODE_ENV
  });
  next();
});

const PORT = process.env.PORT || 3005;

app.listen(PORT, function() {
  console.log(
    `CORS-enabled web server listening on port http://127.0.0.1:${PORT} [${process
      .env.NODE_ENV || "development"}]`
  );
});

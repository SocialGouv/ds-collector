// @flow
const path = require("path");
const express = require("express");
const favicon = require("serve-favicon");
const bodyParser = require("body-parser");
const cors = require("cors");
const { format, subMonths } = require("date-fns");

const log = require("./log");
const { find } = require("./db");
const { getStats, aggregate } = require("./stats");
const { rescan } = require("./ds-api");
const webhookHandler = require("./webhookHandler");
const tokenMiddleware = require("./tokenMiddleware");
const asyncMiddleware = require("./asyncMiddleware");
const openApiDoc = require("./openApiDoc");

const isJson = req => req.headers["accept"] === "application/json";

const app = express();
app.use(favicon(path.join(__dirname, "..", "public", "static", "favicon.ico")));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
app.use(cors());

// for API documentation
app.get("/doc/api-docs.json", function(req, res) {
  res.setHeader("Content-Type", "application/json");
  res.send(openApiDoc());
});

app.use("/doc", express.static("./doc"));

/*
 * @swagger
 * /:
 *   get:
 *     description: get API version or default UI
 *     produces:
 *       - application/json
 *       - text/html
 */
app.get("/", (req, res, next) => {
  log.info("GET /");
  if (isJson(req)) {
    res.json({
      success: true,
      version: require("../package.json").version,
      NODE_ENV: process.env.NODE_ENV
    });
  }
  next();
});

app.use("/", express.static("./public"));

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
 *           enum: [brouillon, en_construction, en_instruction, accepte, refuse, sans_suite]
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
 *       description: réponse de /aggregate
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           value: true
 *         result:
 *           type: object
 *           description: total par libéllé
 *           properties:
 *             key:
 *               type: string
 *               description: libéllé
 *             value:
 *               type: number
 *               description: nombre total
 *     BasicStatResult:
 *       type: object
 *       properties:
 *         count:
 *            type: number
 *            description: nombre total de dossiers
 *         duration:
 *            type: number
 *            description: durée moyenne de traitement
 *         status:
 *            type: object
 *            description: total par statut
 *     StatResult:
 *       description: "renvoie un object avec `{[date]: StatResult}`"
 *       type: object
 *       properties:
 *         key:
 *           type: string
 *           description: the date key
 *           example: 2018-05-20 or 2018-05
 *         value:
 *           $ref: '#/components/schemas/BasicStatResult'
 *     StatsResult:
 *       summary: données de /stats
 *       type: object
 *       properties:
 *         count:
 *           type: number
 *           description: nombre total de dossiers
 *         duration:
 *           type: number
 *           description: durée moyenne de traitement
 *         status:
 *           type: object
 *           description: total par statut
 *         daily:
 *           description: détail par jour
 *           $ref: '#/components/schemas/StatResult'
 *         monthly:
 *           description: détail par mois
 *           $ref: '#/components/schemas/StatResult'
 *     StatsResponse:
 *       description: réponse de /stats
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           value: true
 *         result:
 *           $ref: '#/components/schemas/StatsResult'
 *
 * @swagger
 * /webhook:
 *   post:
 *     summary: DS webhook endpoint
 *     description: receives the webhook payload
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
  asyncMiddleware(async (req, res) => {
    log.info("POST /webhook", req.body);
    const result = await webhookHandler(req.body);
    res.json({ success: true, result });
  })
);

// todo: validate + sanitize input
/**
 * @swagger
 * /stats:
 *   get:
 *     summary: fetch global stats
 *     description: return total and aggregated data for daily, monthly usage stats..
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
 *               $ref: '#/components/schemas/StatsResponse'
 */
app.get(
  "/stats",
  asyncMiddleware(async (req, res) => {
    log.info("GET /stats");
    const oneYearAgo = format(subMonths(new Date(), 12));
    const startDate = req.query.from || oneYearAgo;
    const docs = await find(
      { "dossier.created_at": { $gte: startDate } },
      { "dossier.created_at": 1 }
    );
    res.json({ success: true, result: getStats(docs) });
  })
);

/* ------ PROTECTED ROUTES */

app.use(tokenMiddleware);

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
  asyncMiddleware(async (req, res) => {
    log.info("GET /rescan");
    const result = await rescan();
    res.json({ success: true, result: result.length });
  })
);

/**
 * @swagger
 * /aggregate:
 *   get:
 *     summary: get aggregated stats for a given champ libelle
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
  asyncMiddleware(async (req, res) => {
    log.info("GET /aggregate");
    const docs = await find(
      req.query.filters ? JSON.parse(req.query.filters) : {},
      req.query.sort ? JSON.parse(req.query.sort) : {}
    );
    res.json({ success: true, result: aggregate(docs, req.query.libelle) });
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
  asyncMiddleware(async (req, res) => {
    log.info("GET /dump");
    log.debug(req.query);
    const docs = await find(
      req.query.filters ? JSON.parse(req.query.filters) : {},
      req.query.sort ? JSON.parse(req.query.sort) : {}
    );
    res.json({ success: true, result: docs });
  })
);

const PORT = process.env.PORT || 3005;

if (require.main === module) {
  app.listen(PORT, function() {
    log.info(
      `CORS-enabled web server listening on port http://127.0.0.1:${PORT} [${process
        .env.NODE_ENV || "development"}]`
    );
  });
}

module.exports = app;

// @flow

const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const pino = require("pino")({
  enabled: process.env.NODE_ENV !== "test"
});

const { insert, dump } = require("./db");
const { rescan } = require("./ds-api");
const webhookHandler = require("./webhookHandler");

const app = express();
app.use(bodyParser.json());
app.use(cors());

app.post("/webhook", async (req, res, next) => {
  pino.info("POST /webhook", req.body);
  const message = await webhookHandler(req.body);
  res.json({ success: true, message });
  next();
});

// todo: secure to prevent DoS
app.get("/rescan", async (req, res, next) => {
  pino.info("GET /rescan");
  const message = await rescan();
  res.json({ success: true, message });
  next();
});

// app.get("/dump", async (req, res, next) => {
//   pino.info("GET /dump");
//   const message = await dump();
//   res.json(message);
//   next();
// });

const PORT = process.env.PORT || 3005;

app.listen(PORT, function() {
  console.log(
    `CORS-enabled web server listening on port http://127.0.0.1:${PORT}`
  );
});

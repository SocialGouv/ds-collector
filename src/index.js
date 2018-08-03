// @flow

const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");

const { insert, dump } = require("./db");
const webhookHandler = require("./webhookHandler");

const app = express();
app.use(bodyParser.json());
app.use(cors());

app.get("/webhook", async (req, res, next) => {
  const message = await webhookHandler(req.body);
  res.json({ success: true, message });
  next();
});

app.get("/rescan", async (req, res, next) => {
  const message = await rescan();
  res.json({ success: true, message });
  next();
});

app.get("/dump", async (req, res, next) => {
  const message = await dump();
  res.json(dump);
  next();
});

const PORT = process.env.PORT || 3005;

app.listen(PORT, function() {
  console.log(
    `CORS-enabled web server listening on port http://127.0.0.1:${PORT}`
  );
});

dump().then(console.log);

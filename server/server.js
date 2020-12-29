const http = require("http");
const path = require("path");

const express = require("express");

const cors = require("cors");
const config = require("config");
const routes = require("./routes");
const bodyParser = require("body-parser");
const healthcheck = require("./healthcheck");
const findRemoveSync = require("find-remove");
const { serializeError } = require("serialize-error");
const { workingRoot, inboxPath } = require("./helpers/directories");

const app = express();
const port = config.get("PORT");

app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(express.static(path.join(__dirname, "public")));
app.use(express.static(path.join(__dirname, "static")));
app.use("/", express.static(workingRoot));
app.use("/", routes);

//Log all the errors and send to the client
app.use(function(err, req, res, next) {
  console.error(err);
  const error =
    err instanceof Error || err instanceof TypeError
      ? err
      : new Error(err.message ? err.message : err);
  delete error.stack;
  delete error.metadata;
  res.status(500);
  res.json(serializeError(error));
});

const server = http.createServer(app);

//healthcheck
healthcheck.setupHealthCheck(server);

/* Remove videos from inbox every 10 minutes that are older than an hour
 after moving thumbnails are created */
setInterval(() => {
  findRemoveSync(inboxPath, {
    age: 3600,
    files: "*.*"
  });
}, 600000);

server.listen(port);
console.log(`Server running in ${process.env.NODE_ENV} mode`);
console.log(`💻  Listening on port ${port}`);

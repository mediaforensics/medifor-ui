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

const app = require("./createExpress");
const port = config.get("PORT");

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

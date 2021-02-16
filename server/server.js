const http = require("http");
const config = require("config");
const healthcheck = require("./healthcheck");
const findRemoveSync = require("find-remove");
const { inboxPath } = require("./helpers/directories");
const port = config.get("PORT");

/* Create express server */
const app = require("./createExpress").generateExpress();
const server = http.createServer(app);

/* Setup healthcheck */
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

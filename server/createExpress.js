const cors = require("cors");
const path = require("path");
const express = require("express");
const routes = require("./routes");
const bodyParser = require("body-parser");
const { serializeError } = require("serialize-error");
const { workingRoot } = require("./helpers/directories");

const app = express();

exports.generateExpress = () => {
  app.use(cors());
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(bodyParser.json());

  app.use(express.static(path.join(__dirname, "public")));
  app.use(express.static(path.join(__dirname, "static")));
  app.use("/", express.static(workingRoot));
  app.use("/", routes);

  /* Logging middleware */
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
  return app;
};

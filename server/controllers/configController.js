const config = require("config");

exports.config = async function(req, res, next) {
  res.json(config.get("UI"));
};

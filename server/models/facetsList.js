const config = require("config");

module.exports = {
  facets: config.has("FACETS") ? config.get("FACETS") : []
};

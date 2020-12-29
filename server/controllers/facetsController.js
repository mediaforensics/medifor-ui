const { facets } = require("../models/facetsList");

exports.index = async function(req, res, next) {
  res.json({ facets });
};

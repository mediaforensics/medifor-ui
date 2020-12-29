const Pipeline = require("../models/pipeline");

exports.index = async function(req, res, next) {
  const analyticsList = await Pipeline.getAnalyticsList();
  res.json(analyticsList);
};

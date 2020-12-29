const config = require("config");
const Tags = require("../services/tags");
/* enableGroups will be string 'false' in K8s setup, must typecast to Boolean */
const enabledGroups = JSON.parse(config.get("UI.enableGroups"));

exports.index = async (req, res, next) => {
  let detectionTagRequest = {};
  let { tagsForFiltering } = req.query;

  /* All tags from the request query will be used to filter down to coexisting tags */
  if (tagsForFiltering) {
    tagsForFiltering = tagsForFiltering.split(",");
    tagsForFiltering.forEach(tag => {
      let [key, value] = tag.split("=");
      detectionTagRequest[key] = value;
    });
  }

  /* Filter out all tags in the tag response that have tagPrefixFlax
   * This allows for all tags of a group to be returned without all of the users of that group returned */
  const groupKey = enabledGroups
    ? `${config.get("UI.tagPrefixFlag")}${config.get("UI.groupTagPrefix")}`
    : false;
  const userKey = config.has("UI.userTagPrefix")
    ? `${config.get("UI.tagPrefixFlag")}${config.get("UI.userTagPrefix")}`
    : false;

  const tags = await Tags.getDetectionTagInfo(
    detectionTagRequest,
    userKey,
    groupKey
  );

  res.json(tags);
};

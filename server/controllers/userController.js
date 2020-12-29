const config = require("config");

const show = async (req, res, next) => {
  res.json({
    user: {
      name: req.headers.username,
      groups: req.headers.usergroups && req.headers.usergroups.split(","),
      displayName: req.headers.displayname,
      admin: checkAdmin(req.headers.usergroups)
    }
  });
};

/* Filter out the medifor user groups and determine if user is an admin */
const checkAdmin = (groups = null) => {
  if (!groups) return false;
  const { groupPrefix = null } = config.get("UI");
  const groupsFormatted = groups.split(",");
  const filteredGroups = groupsFormatted.map(group =>
    group.replace(groupPrefix, "")
  );
  return filteredGroups.includes("admin") || filteredGroups.includes("Admin");
};

module.exports = { show, checkAdmin };

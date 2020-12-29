/* Module to handle user preferences for preferred colormap,
 * sort direction and fusion model */

const storageLocation = localStorage;

exports.setPreference = (preference, value) => {
  storageLocation.setItem(preference, value);
};

/* If preference is not present it will return false */
exports.getPreference = preference => {
  return storageLocation.getItem(preference);
};

exports.getAllPreferences = () => {
  return storageLocation;
};

const path = require("path");
const fs = require("fs");
const config = require("config");

const applicationRoot = path.dirname(process.mainModule.filename);

const containerRoot = config.get("CONTAINER_ROOT");

/* WORKING_DIR does not exist in config file. WORKING_DIR is used for development.
 * Will pull from nodemon.json when building from source
 * WORKING_DIR will be set to the same as CONTAINER_ROOT when missing from config
 * such as when running in docker.
 */
let workingRoot;
if (config.has("WORKING_DIR")) {
  workingRoot = config.get("WORKING_DIR");
} else {
  workingRoot = containerRoot;
}

const directories = {
  thumbnails: "input/thumbnails"
};

const applicationDirectories = {
  inboxPath: path.join(workingRoot, "inbox"),
  applicationOutputPath: path.join(workingRoot, "output"),
  applicationInputPath: path.join(workingRoot, "input"),
  thumbnailPath: path.join(workingRoot, directories.thumbnails),
  transcodedVideoPath: path.join(workingRoot, "input/transcoded")
};

const containerDirectories = {
  containerOutputPath: path.join(containerRoot, "output"),
  containerInputPath: path.join(containerRoot, "input")
};

Object.keys(applicationDirectories).forEach(directory => {
  const directoryPath = applicationDirectories[directory];
  try {
    fs.accessSync(directoryPath);
  } catch (err) {
    fs.mkdirSync(directoryPath, { recursive: true });
    console.log(`✅  Making ${directoryPath}`);
  }
});

module.exports = {
  viewsRoot: path.join(applicationRoot, "views"),
  protosRoot: path.join(applicationRoot, "proto"),
  workingRoot,
  ...applicationDirectories,
  ...containerDirectories,
  ...directories
};

const mime = require("mime-types");
const path = require("path");
const sharp = require("sharp");

const { workingRoot } = require("../helpers/directories");

exports.rotate = async (req, res) => {
  const deg = parseInt(req.query.rotateValue);
  const imgpath = req.query.path;
  const full = path.join(workingRoot, imgpath);

  res.set({
    "Cache-Control": "public, max-age=3600",
    "Content-Type": mime.contentType(path.basename(imgpath))
  });

  sharp(full)
    .rotate(deg)
    .pipe(res);
};

const fs = require("fs");
const util = require("util");
const path = require("path");
const sharp = require("sharp");
const config = require("config");
const request = require("request");
const FileType = require("file-type");

const hasha = require("hasha");
const multer = require("multer");
const mime = require("mime-types");
const exiftool = require("exiftool-vendored").exiftool;

const ffmpeg = require("fluent-ffmpeg");
const ffprobe = util.promisify(ffmpeg.ffprobe);

const { Worker } = require("worker_threads");

const Pipeline = require("../models/pipeline");
const { imageScreenGrab } = require("../helpers/screenshot");
const {
  generateWaveFile,
  generateVideo
} = require("../helpers/audioConverter");

const {
  inboxPath,
  thumbnailPath,
  containerInputPath,
  containerOutputPath,
  transcodedVideoPath,
  applicationInputPath
} = require("../helpers/directories");

/* These values should always be defined in config */
/* enableGroups will be string 'false' in K8s setup, must typecast to Boolean */
const enabledGroups = JSON.parse(config.get("UI.enableGroups"));
const groupTagPrefix = config.get("UI.groupTagPrefix");
const tagPrefixFlag = config.get("UI.tagPrefixFlag");
const userTagPrefix = config.get("UI.userTagPrefix");

const multerOptions = multer({
  storage: multer.diskStorage({
    destination(req, file, cb) {
      cb(null, inboxPath);
    },
    filename(req, file, cb) {
      cb(null, file.originalname);
    }
  }),
  fileFilter(req, file, cb) {
    /* Don't allow the user to upload an image if there are no running image analytics
     * Don't allow the user to upload a video/audio if there are no running video analytics */

    Pipeline.getAnalyticsList()
      .then(response => {
        const { imageAnalytics, videoAnalytics } = response;
        const list = {
          hasImageAnalytics: imageAnalytics.length > 0,
          hasVideoAnalytics: videoAnalytics.length > 0,
          hasAudioAnalytics: videoAnalytics.length > 0
        };
        const isAccepted =
          (file.mimetype.startsWith("image/") && list.hasImageAnalytics) ||
          (file.mimetype.startsWith("video/") && list.hasVideoAnalytics) ||
          (file.mimetype.startsWith("audio/") && list.hasAudioAnalytics);
        if (isAccepted) {
          cb(null, true);
        } else {
          req.fileAcceptanceError =
            "Unsupported media type or no analytics running for media type";
          return cb(null, false, new Error("File cannot be uploaded"));
        }
      })
      .catch(() => "Error verifying probe on upload");
  }
}).single("probe");

exports.upload = (req, res, next) => {
  multerOptions(req, res, () => {
    if (req.fileAcceptanceError) {
      return res.status(415).send(req.fileAcceptanceError);
    } else next();
  });
};

/* If the probe is uploaded via link, this function pulls down the file and creates
 * the necessary objects to make it seem like its coming from multer to any downstream functions*/
exports.fromURL = (req, res, next) => {
  if (req.body.uploadUrl !== undefined || req.body.uploadUrl !== "") {
    let probeFilename = encodeURIComponent(req.body.uploadUrl.split("/").pop());

    req.file = {
      fieldname: "probe",
      originalname: probeFilename,
      destination: inboxPath,
      path: `${inboxPath}/${probeFilename}`
    };

    request
      .get({ uri: req.body.uploadUrl, encoding: null })
      .on("response", response => {
        if (response.headers["content-type"].includes("image")) {
          req.file.size = response.headers["content-length"];
          req.file.encoding = response.headers["content-encoding"];
          return response
            .pipe(fs.createWriteStream(req.file.path))
            .on("close", () => {
              next();
            });
        } else {
          return res.status(415).send("Invalid URL: Not an image");
        }
      });
  } else {
    return res.status(404).json("Invalid URL : Undefined");
  }
};

exports.prepfile = async (req, res, next) => {
  const file = req.file;
  const { ext, mime: mime } = await FileType.fromFile(file.path);
  const [mimetype, mimeSubtype] = mime.split("/");
  const extname = `.${ext}`;

  /* Generate the Md5 hash for the probe */
  let probeFilename =
    (await hasha.fromFile(file.path, { algorithm: "md5" })) + extname;
  /* This allows the same probe to be uploaded to multiple groups by making the filename = `groupname_md5hash`*/
  if (enabledGroups) {
    const { group: md5Prefix = null } = req.query;
    probeFilename = `${md5Prefix}${probeFilename}`;
  }

  /* Original file stays in the inbox path until submission to pipeline */
  req.body.probe = {
    destination: applicationInputPath,
    filename: probeFilename,
    originalname: file.originalname.split(".")[0] + extname,
    path: path.join(inboxPath, probeFilename),
    finalPath: path.join(applicationInputPath, probeFilename),
    mimetype: mime,
    isImage: (() => (mimetype === "image" ? true : false))(),
    isVideo: (() => (mimetype === "video" ? true : false))(),
    isAudio: (() => (mimetype === "audio" ? true : false))(),
    /* Need to have indicator that the file was audio at some point,
     * this info is need for video thumbnail */
    wasAudio: (() => (mimetype === "audio" ? true : false))(),
    mime: {
      type: mimetype,
      subtype: mimeSubtype
    }
  };

  /* Rename the original file to the Md5 hash file and keep it in inbox */
  fs.renameSync(file.path, req.body.probe.path);

  next();
};

exports.preprocess = async (req, res, next) => {
  const detectionRequest = {};
  const probe = req.body.probe;
  const userTag = `${tagPrefixFlag}${userTagPrefix}`;
  const taggedHashes = await buildHashObject(probe.path);
  const exifData = await getCleanedExifData(req.headers.username, probe);

  /* detectionRequest will be appended to req.body for submission to the pipeline
   * contains all the info that the pipeline needs to run the analytics on it */
  detectionRequest.user_tags = {};
  detectionRequest.id = path.parse(probe.filename).name;
  detectionRequest.tags = { type: probe.mime.type };

  /* Tag the uploaded probe with the current user tag */
  if (req.body[userTag]) {
    detectionRequest.tags = appendGroupAndUserTags({
      detectionRequest: detectionRequest,
      reqUserVal: req.body[userTag],
      userKey: userTag
    });
  }
  /* Tag the uploaded probe with the current group if grouping is enabled */
  if (enabledGroups) {
    const groupTag = `${tagPrefixFlag}${groupTagPrefix}`;
    detectionRequest.tags = appendGroupAndUserTags({
      detectionRequest: detectionRequest,
      reqGroupVal: req.body[groupTag],
      groupKey: groupTag
    });
  }

  detectionRequest.meta = {
    ...taggedHashes,
    ...exifData
  };

  req.body.detectionRequest = detectionRequest;

  next();
};

/* The pipeline does not support audio files, this will convert audio uploads to a 'static' video file */
exports.makeAudioVideo = async (req, res, next) => {
  if (req.body.probe.isAudio) {
    const probe = req.body.probe;

    /* Get the waveform of the audio upload */
    const wavePath = await generateWaveFile(applicationInputPath, probe);
    /* Convert the waveform into a video file while maintaining the original audio */
    const videoFilename = await generateVideo(
      wavePath,
      applicationInputPath,
      probe
    );

    /* Get the new mime type now that we have converted audio file to video */
    const videoPath = path.join(applicationInputPath, videoFilename);
    const newMimeType = mime.lookup(videoPath);
    const [mimetype, mimeSubtype] = newMimeType.split("/");

    /* Overwrite these values now that we have generated a new file */
    req.file.mimetype = newMimeType;
    req.body.probe.path = videoPath;
    req.body.probe.mimetype = newMimeType;
    req.body.probe.filename = videoFilename;
    req.body.probe.mime = {
      type: mimetype,
      subtype: mimeSubtype
    };
    req.body.probe.isVideo = true;
    req.body.probe.isAudio = false;
    req.body.detectionRequest.tags.type = mimetype;

    next();
  }
  next();
};

/* Extract user tags and append to detection request */
exports.extractTags = (req, res, next) => {
  const detectionRequest = req.body.detectionRequest;
  if (req.body.tags) {
    req.body.tags
      .split(",")
      .forEach(t => (detectionRequest.user_tags[t.toLowerCase()] = null));
  }
  next();
};

exports.createImageRequest = async (req, res, next) => {
  if (req.body.probe.isImage) {
    const probe = req.body.probe;

    /* Container directories are where the analytic containers are able to access the probe
     * since they have no knowledge of local file system */
    req.body.detectionRequest.request = {
      img_manip_req: {
        image: {
          uri: path.join(containerInputPath, probe.filename),
          type: probe.mimetype
        },
        out_dir: containerOutputPath
      }
    };

    await thumbnailify(probe.path, path.join(thumbnailPath, probe.filename));
  }
  next();
};

exports.createVideoRequest = async (req, res, next) => {
  if (req.body.probe.isVideo) {
    const probe = req.body.probe;

    /* Container directories are where the analytic containers are able to access the probe
     * since they have no knowledge of local file system */
    req.body.detectionRequest.request = {
      vid_manip_req: {
        video: {
          uri: path.join(containerInputPath, probe.filename),
          type: probe.mimetype
        },
        out_dir: containerOutputPath
      }
    };

    let dataForVideo = await imageScreenGrab(
      probe.path,
      path.join(thumbnailPath, probe.filename),
      probe.wasAudio
    );
    /* This data gets passed to the worker thread */
    dataForVideo = {
      ...dataForVideo,
      probe: probe,
      transcodedVideoPath: transcodedVideoPath
    };
    makeMovingThumbnailAndTranscode(dataForVideo);

    const videoMeta = await ffprobe(probe.path);
    const video = videoMeta.streams.find(stream => {
      return stream.codec_type === "video";
    });
    req.body.detectionRequest.meta["File:Frames"] = video.nb_frames;
  }
  next();
};

exports.submitDetection = async (req, res, next) => {
  let detection;
  const {
    mime,
    isImage,
    isVideo,
    filename,
    finalPath,
    path: inboxPath
  } = req.body.probe;

  if (isImage) {
    /* Can copy image immediately over from inbox to input */
    fs.renameSync(inboxPath, finalPath);
    detection = await Pipeline.detectImage(req.body.detectionRequest);
  } else if (isVideo) {
    /* Video still remain in inbox until moving thumbnail is created */
    copyFiles({ finalPath, inboxPath, filename, mime });
    detection = await Pipeline.detectVideo(req.body.detectionRequest);
  } else {
    next();
  }
  res.status(201).json(detection);
  next();
};

/* Get image thumbnail for gallery */
async function thumbnailify(sourcePath, destinationPath) {
  return sharp(sourcePath)
    .resize({ height: 150 })
    .toFile(destinationPath);
}

/* Get hashes for metadata */
async function getHashes(filePath) {
  const hashes = {};
  const algorithms = ["md5", "sha1", "sha256", "sha512"];

  for (const algorithm of algorithms) {
    hashes[algorithm] = await hasha.fromFile(filePath, { algorithm });
  }

  return hashes;
}

/* Builds the hash object that will be appended to the metadata */
async function buildHashObject(probePath) {
  const hashObject = {};
  const hashes = await getHashes(probePath);
  const hashKeys = Object.keys(hashes);
  hashKeys.forEach(k => (hashObject[`Hash:${k}`] = hashes[k]));

  return hashObject;
}

/* Gets the metadata and cleans it for display */
async function getCleanedExifData(username, probe) {
  const exifData = await exiftool.read(probe.path, ["-G", "-s"]);

  /* Add UploadedBy to metadata */
  if (!!username) {
    exifData["File:UploadedBy"] = username;
  }
  /* Rename field to UploadDate */
  exifData["File:UploadDate"] = exifData["File:FileModifyDate"];
  /* Original file name */
  exifData["File:FileName"] = probe.originalname;

  const keyBlacklist = [
    "SourceFile",
    "File:FileModifyDate",
    "File:FileAccessDate",
    "File:FileInodeChangeDate",
    "File:Directory",
    "File:FilePermissions",
    "errors"
  ];

  for (const key of keyBlacklist) {
    delete exifData[key];
  }

  return exifData;
}

/* Duplicate videos and copy them to input and transcoded directories */
function copyFiles({ finalPath, inboxPath, filename, mime }) {
  fs.createReadStream(inboxPath).pipe(fs.createWriteStream(finalPath));
  if (mime.subtype == "mp4") {
    fs.createReadStream(inboxPath).pipe(
      fs.createWriteStream(path.join(transcodedVideoPath, filename))
    );
  }
}

/* Append the grouping tags to the system tags in the detectionRequest */
function appendGroupAndUserTags({
  detectionRequest,
  reqGroupVal = null,
  reqUserVal = null,
  groupKey = null,
  userKey = null
}) {
  const systemKeys = {};

  /* If the config file defines a group key and if the request has a value for that group key
   * If the config file defines a user key and there is a current user
   * This will add {__group: "foo", __user: "jdoe"} to tags : { type: video/image}
   */

  if (reqGroupVal && groupKey) systemKeys[groupKey] = reqGroupVal;
  if (reqUserVal && userKey) systemKeys[userKey] = reqUserVal;

  /* Append system keys to tags */
  if (Object.entries(systemKeys).length > 0) {
    return {
      ...detectionRequest.tags,
      ...systemKeys
    };
  }
  return detectionRequest.tags;
}
/* Generate a worker thread to transcode the video and create moving thumbnail */
function makeMovingThumbnailAndTranscode(dataForVideo) {
  return new Promise((resolve, reject) => {
    const worker = new Worker("./helpers/videoScreenGrabAndTranscode.js", {
      workerData: dataForVideo
    });
    worker.on("message", message => {
      console.log(message);
      resolve;
    });
    worker.on("error", error => {
      console.log(`Worker failed with error : ${error}`);
      reject(error);
    });
    worker.on(
      "exit",
      code =>
        code !== 0 &&
        reject(
          new Error(`Worker stopped with 
        exit code : ${code}`)
        )
    );
  });
}

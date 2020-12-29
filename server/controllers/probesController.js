const fs = require("fs");
const path = require("path");
const get = require("lodash.get");
const archiver = require("archiver");
const { parse } = require("json2csv");
const Pipeline = require("../models/pipeline");
const Tags = require("../services/tags");
const { checkAdmin } = require("./userController");
const {
  applicationInputPath,
  applicationOutputPath,
  transcodedVideoPath
} = require("../helpers/directories");

const transformAnalyticList = require("../helpers/analyticListTransformer");
const pdfHelper = require("../helpers/pdfHelper");

exports.show = async (req, res, next) => {
  const detectionRequest = {};
  if (req.params.id) {
    detectionRequest.id = req.params.id; // detectionInfoRequest
    detectionRequest.detection_ids = [req.params.id]; // detectionListRequest
  } else {
    throw new Error("Bad request - No ID provided");
  }

  detectionRequest.want_fused = true;

  const fuser = req.query.fuser_id;
  const csvRequested = req.query.csv && req.query.csv === "yes" ? true : false;
  const pdfRequested = req.query.pdf && req.query.pdf === "yes" ? true : false;

  Pipeline.getDetectionInfo(detectionRequest)
    .then(detectionItem => {
      if (csvRequested)
        downloadCSV(res, fuser, { detections: [detectionItem] }, true);
      else if (pdfRequested)
        downloadPDF(res, fuser, { detections: [detectionItem] });
      else res.json(detectionItem);
    })
    .catch(next);
};

exports.deleteProbe = async (req, res, next) => {
  const detectionRequest = {};
  const deleteDetectionRequest = {};
  const { usergroups: groups = "", username = "" } = req.headers;
  const userIsAdmin = checkAdmin(groups);

  if (req.params.id) {
    deleteDetectionRequest.detection_id = req.params.id;
    detectionRequest.id = req.params.id;
  } else {
    throw new Error("No Id Provided");
  }

  /* Get the meta data from requested probe and match it to request user */
  const detection = await Pipeline.getDetectionInfo(detectionRequest);

  /* If user is admin or they uploaded the probe then delete */
  if (userIsAdmin || detection.meta["File:UploadedBy"] == username) {
    Pipeline.deleteDetection(deleteDetectionRequest)
      .then(() => {
        res.status(200).json("Probe Deleted");
      })
      .catch(next);
  } else
    return res
      .status(401)
      .json("User does not have permissions to delete selected probe");
};

exports.deleteTagged = async (req, res, next) => {
  const deleteTaggedRequest = {};

  if (req.query.tags) {
    deleteTaggedRequest.tags = extractFullTags(req.query.tags);
  }

  Pipeline.getDetectionList(deleteTaggedRequest)
    .then(detectionList => {
      deleteTaggedProbe(res, detectionList);
    })
    .catch(next);
};

exports.extractSortOptions = (req, res, next) => {
  let sortOptions = null;
  let isAsc = false;

  if (req.query.dir && req.query.dir === "1") isAsc = true;

  if (req.query.column && req.query.column === "score") {
    let fuserId = req.query.fuser || req.query.fuser_id || "ta2";
    sortOptions = {
      orderBy: [
        {
          key: 0, // score sort
          is_asc: isAsc
        },
        {
          key: 1, // meta sort
          is_asc: isAsc,
          meta_key: "Hash:md5"
        }
      ],
      fuserId
    };
  } else if (req.query.column) {
    let fuserId = req.query.fuser || req.query.fuser_id || "ta2";
    sortOptions = {
      orderBy: [
        {
          key: 1, // meta sort
          is_asc: isAsc,
          meta_key: req.query.column
        },
        {
          key: 1, // meta sort
          is_asc: isAsc,
          meta_key: "Hash:md5"
        }
      ],
      fuserId
    };
  }

  req.body.sortOptions = sortOptions;

  next();
};

exports.index = async (req, res, next) => {
  let detectionListRequest = {};
  const { sortOptions } = req.body;
  const {
    tags = null,
    fuser = null,
    pageToken = null,
    detection_ids = null,
    csv: csvRequested = null,
    fusion_threshold_type = null,
    fusion_threshold_value = null
  } = req.query;

  detectionListRequest = {
    verbosity: csvRequested ? 0 : 1,
    page_token: pageToken ? pageToken : "",
    tags: tags ? extractFullTags(tags) : "",
    order_by: sortOptions && sortOptions.orderBy,
    fuser_id: sortOptions && sortOptions.fuserId,
    detection_ids: detection_ids ? detection_ids.split(",") : "",
    fusion_threshold_type: fusion_threshold_type
      ? parseInt(fusion_threshold_type)
      : "",
    fusion_threshold_value: fusion_threshold_value
      ? 1 - fusion_threshold_value
      : ""
  };

  Pipeline.getDetectionList(detectionListRequest)
    .then(detectionList => {
      if (!!csvRequested) {
        /*
         * Pipeline is only able to return 100 items per request
         * If user is downloading a CSV from gallery with over 100 items, must have way to append requests and return
         */
        appendDetections(detectionList, detectionListRequest)
          .then(response => {
            downloadCSV(res, fuser, response, false);
          })
          .catch(err => console.log(err));
      } else res.json(detectionList);
    })
    .catch(next);
};

const appendDetections = async (detectionList, detectionListRequest) => {
  //If response from pipeline contains a page token keep submitting requests
  while (detectionList.page_token != "") {
    const newToken = detectionList.page_token;
    // Update request to use the new token
    detectionListRequest.page_token = newToken;
    // Get the next page from the pipeline
    const nextPage = await Pipeline.getDetectionList(detectionListRequest);
    // Copy items from pipeline to current object
    detectionList.detections = [
      ...detectionList.detections,
      ...nextPage.detections
    ];
    // Update the current object to use most recent page token
    detectionList.page_token = nextPage.page_token;
  }
  // Return detectionlist object with all possible detections
  return detectionList;
};

const downloadCSV = async (res, fuser, detectionList, wantFusers) => {
  const archive = archiver("zip");
  const info = [];
  const filelist = extractFileList(detectionList);
  const analyticDataList = await extractAnalyticDataList(
    detectionList,
    wantFusers
  );
  const fields = Object.keys(analyticDataList[0][0]).filter(
    field => field !== "maskImagePath"
  );
  const mediaBasePath = "/media";
  const now = new Date();

  fields.unshift("originalFileName");
  fields.unshift("probeFileName");
  fields.push("maskPath");

  res.setHeader("Content-Type", "application/zip");
  res.attachment(
    `medifor_export-${now.getFullYear()}${now.getMonth()}${now.getDate()}${now.getHours()}${now.getMinutes()}${now.getSeconds()}.zip`
  );

  archive.on("error", err => {
    throw err;
  });

  archive.pipe(res);

  for (const idx in filelist) {
    archive.file(filelist[idx]["inputPath"], {
      name: path.join(
        mediaBasePath,
        path.basename(filelist[idx]["originalFile"]),
        path.basename(filelist[idx]["inputPath"])
      )
    });

    analyticDataList[idx].forEach(analytic => {
      let maskPath = null;

      if (analytic.maskImagePath) {
        maskPath = addMaskToArchive(
          filelist[idx]["originalFile"],
          analytic.maskImagePath,
          analytic.probeId,
          archive
        );
      }

      info.push({
        probeFileName: path.basename(filelist[idx]["inputPath"]),
        originalFileName: filelist[idx]["originalFile"],
        maskPath,
        ...analytic
      });
    });
  }

  try {
    const infoCSV = parse(info, { fields });
    archive.append(infoCSV, { name: "index.csv" });
  } catch (err) {
    console.error(err);
  }

  archive.finalize();
  return;
};

const downloadPDF = async (res, fuser, detectionList) => {
  const { fusers: fusionList } = await Pipeline.getAnalyticsList();
  const analyticDataList = await extractAnalyticDataList(detectionList, false);

  pdfHelper.createPDF(fuser, fusionList, analyticDataList, detectionList, res);
};

const deleteTaggedProbe = (res, detectionDeleteList) => {
  deleteDetectionRequest = {};

  detectionDeleteList.detections.forEach(detection => {
    deleteDetectionRequest.detection_id = detection.meta["Hash:md5"];
    Pipeline.deleteDetection(deleteDetectionRequest).then(response => {
      res.send("Probe Deleted");
    });
  });
};

const addMaskToArchive = (originalName, maskPath, probeId, archive) => {
  const basePath = maskPath.split(path.sep).slice(-3);
  const analyticId = basePath[0];
  const ext = path.extname(basePath[2]);
  const sourceMaskPath = path.join(applicationOutputPath, ...basePath);

  // /media/{originalName}/masks/{analytic_id}.{ext}
  const archiveMaskPath = path.join(
    "media",
    originalName,
    "masks",
    `${analyticId}${ext}`
  );

  archive.file(sourceMaskPath, { name: archiveMaskPath });
  return archiveMaskPath;
};

const extractFileList = detectionList => {
  let base;
  let dir;

  return detectionList.detections.map(detection => {
    const originalFileName = detection.meta["File:FileName"];
    const analyticInfo = detection.analytic_info[0];

    if (analyticInfo.detection.img_manip_req) {
      base = path.basename(analyticInfo.detection.img_manip_req.image.uri);
      dir = applicationInputPath;
    } else if (analyticInfo.detection.vid_manip_req) {
      base = path.basename(analyticInfo.detection.vid_manip_req.video.uri);
      dir = transcodedVideoPath;
    }

    return {
      originalFile: originalFileName,
      inputPath: path.format({ dir, base })
    };
  });
};

const extractAnalyticDataList = async (detectionList, wantFusers) => {
  const {
    imageAnalytics,
    videoAnalytics,
    fusers: fusion
  } = await Pipeline.getAnalyticsList();

  const imageAnalyticsList = transformAnalyticList(imageAnalytics);
  const videoAnalyticsList = transformAnalyticList(videoAnalytics);
  const fusionAnalyticList = transformAnalyticList(fusion);

  const targets = {
    image: {
      manipulationProp: "img_manip",
      analyticsList: imageAnalyticsList,
      fusionList: fusionAnalyticList
    },
    video: {
      manipulationProp: "vid_manip",
      analyticsList: videoAnalyticsList,
      fusionList: fusionAnalyticList
    }
  };

  // each probe

  const analytics = detectionList.detections.map(detection => {
    const target = targets[detection.tags.type];
    const msTime = detector => {
      let msTime =
        detector.end_time_millis.low - detector.start_time_millis.low;
      let min = Math.floor(msTime / 60000);
      let sec = Math.round((msTime % 60000) / 1000.0);

      return (min == 0) & (sec == 0)
        ? `${msTime}ms`
        : min == 0
        ? sec + "s"
        : min + "m " + sec + "s";
    };
    /* Some analytic containers will give location for a mask but it won't exist
     * This will check that the mask actually exists at the location */
    const fullMaskPath = info => {
      let tempPath = get(
        info.detection[target.manipulationProp],
        "localization.mask.uri"
      );
      if (!tempPath) return undefined;
      else {
        let [, analyticMaskPath] = tempPath.split("output/");
        /* Replace path for running in development/prod */
        const finalPath = path.join(applicationOutputPath, analyticMaskPath);
        try {
          if (fs.existsSync(finalPath)) return finalPath;
        } catch (err) {
          console.log("Mask doesn't exist at that location");
          return undefined;
        }
      }
    };

    return detection.analytic_info.map(info => ({
      stage: info.stage,
      status: info.status,

      probeId: detection.id,
      analyticID: info.analytic_id,
      friendlyName:
        (target.analyticsList[info.analytic_id] &&
          target.analyticsList[info.analytic_id].name) ||
        "",
      description:
        (target.analyticsList[info.analytic_id] &&
          target.analyticsList[info.analytic_id].description) ||
        "",
      integrityScore:
        (info.detection[target.manipulationProp] &&
          info.detection[target.manipulationProp].score) ||
        -1,
      maskImagePath: fullMaskPath(info),
      tags: Object.keys(detection.user_tags)
        .sort()
        .join(", "),
      facets:
        (info.detection[target.manipulationProp] &&
          info.detection[target.manipulationProp].facets) ||
        {},
      explanation:
        (info.detection[target.manipulationProp] &&
          info.detection[target.manipulationProp].explanation) ||
        "",
      time: msTime(info.detection)
    }));
  });
  //Only want fusers on a CSV download if it is for a single probe
  if (!wantFusers) return analytics;
  //each probe -- each fusion model ran on probe
  const fusers = detectionList.detections.map(detection => {
    const target = targets[detection.tags.type];

    return detection.fusion_info.map(info => ({
      stage: info.stage,
      status: info.status,

      probeId: detection.id,
      analyticID: info.fuser_id,
      friendlyName:
        (target.fusionList[info.fuser_id] &&
          target.fusionList[info.fuser_id].name) ||
        "",
      description:
        (target.fusionList[info.fuser_id] &&
          target.fusionList[info.fuser_id].description) ||
        "",
      integrityScore:
        info.fusion[target.manipulationProp] &&
        info.fusion[target.manipulationProp].score &&
        0 <= info.fusion[target.manipulationProp].score <= 1
          ? info.fusion[target.manipulationProp].score
          : -1,
      maskImagePath: get(
        info.fusion[target.manipulationProp],
        "localization.mask.uri"
      ),
      tags: Object.keys(detection.user_tags)
        .sort()
        .join(", ")
    }));
  });

  return [[...analytics[0], ...fusers[0]]];
};

const extractFullTags = tagList => {
  const tags = {};
  tagList.split(",").forEach(t => {
    let [k, v] = t.split("=");
    tags[k.toLowerCase()] = v;
  });
  return tags;
};

const extractTags = tagList => {
  const tags = {};
  tagList.split(",").forEach(t => (tags[t.toLowerCase()] = null));
  return tags;
};

async function replaceTags(req, res, next) {
  const detectionId = req.params.id;
  let tags = {};

  if (req.body.tags) {
    tags = extractTags(req.body.tags);
  }

  const detectionInfo = await Tags.updateDetectionTags(detectionId, true, tags);
  res.json(detectionInfo);
}

async function mergeTags(req, res, next) {
  const detectionId = req.params.id;
  let tags = {};

  if (req.body.tags) {
    tags = extractTags(req.body.tags);
  }

  const detectionInfo = await Tags.updateDetectionTags(
    detectionId,
    false,
    tags
  );
  res.json(detectionInfo);
}

async function deleteTags(req, res, next) {
  const detectionId = req.params.id;
  const tags = {};
  let tagsToDelete = [];

  if (req.body.tags) {
    tagsToDelete = req.body.tags.split(",").map(t => t.toLowerCase());
  }

  // Replace must be false for delete to work
  const detectionInfo = await Tags.updateDetectionTags(
    detectionId,
    false,
    tags,
    tagsToDelete
  );
  res.json(detectionInfo);
}
exports.tags = {
  replace: replaceTags,
  merge: mergeTags,
  delete: deleteTags
};

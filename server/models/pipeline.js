const path = require("path");
const fs = require("fs");
const NodeCache = require("node-cache");

const protoLoader = require("@grpc/proto-loader");
const grpc = require("@grpc/grpc-js");
const config = require("config");
const { protosRoot } = require("../helpers/directories");

const cache = new NodeCache();
const CACHE_DURATION = config.get("CACHE_TTL_SECONDS");
const CACHE_KEY = "analyticList";

/* The pipeline returns integers for these values */
const media_type = {
  IMAGE: 0,
  VIDEO: 1,
  FUSION_IMAGE: 2,
  FUSION_VIDEO: 3,
};

const fusersFor = (type, fusers) =>
  fusers
    .filter((fuser) => fuser.handles.includes(type))
    .map((fuser) => fuser.id);

/* Extracts the image & video analytics and formats them correctly */
const filterAnalytics = (analyticsList, type) => {
  return analyticsList
    .filter((container) => container.media[0] == type)
    .map((container) => {
      return {
        id: container.id,
        description: container.description,
        name: container.name,
      };
    });
};

/* Extracts the fusers and formats them correctly */
const filterFusers = (analyticsList) => {
  return analyticsList
    .filter(
      (container) =>
        container.media.includes(media_type.FUSION_IMAGE) ||
        container.media.includes(media_type.FUSION_VIDEO)
    )
    .map((container) => {
      return {
        id: container.id,
        description: container.description,
        name: container.name,
        handles: container.media.map((type) => {
          return type == media_type.FUSION_IMAGE ? "image" : "video";
        }),
      };
    });
};

/* Fetches the list from the pipeline and formats it correct for the UI */
const fetchAnalyticsFromPipeline = (analyticsListRequest = {}) => {
  return new Promise((resolve, reject) => {
    // Returns a undefined if not found or expired.
    let fetchedAnalyticsList = cache.get(CACHE_KEY);
    if (!fetchedAnalyticsList) {
      workflowClient.getAnalyticMeta(analyticsListRequest, (err, response) => {
        if (err) reject(err);
        else {
          const formattedAnalytics = {
            imageAnalytics: filterAnalytics(
              response.analytics,
              media_type.IMAGE
            ),
            videoAnalytics: filterAnalytics(
              response.analytics,
              media_type.VIDEO
            ),
            fusers: filterFusers(response.analytics),
          };
          fetchedAnalyticsList = { ...formattedAnalytics };
          cache.set(CACHE_KEY, fetchedAnalyticsList, CACHE_DURATION);
          resolve(fetchedAnalyticsList);
        }
      });
    } else {
      resolve(fetchedAnalyticsList);
    }
  }).catch((error) => {
    console.log(
      `Error retrieving analytics metadata from analytic workflow. Check that analytic workflow is running.\nTerminating process. Failed with code ${error} `
    );
    throw error;
  });
};

const detect = (request) => {
  return new Promise((resolve, reject) => {
    workflowClient.Detect(request, (err, response) => {
      if (err) reject(err);
      resolve(response);
    });
  });
};

exports.detectImage = async (detectionRequest) => {
  const { imageAnalytics, fusers } = await fetchAnalyticsFromPipeline();
  detectionRequest.analytic_id = imageAnalytics.map((a) => a.id);
  detectionRequest.fuser_id = fusersFor("image", fusers);

  return detect(detectionRequest)
    .then((response) => {
      return response;
    })
    .catch((err) => {
      throw err;
    });
};

exports.detectVideo = async (detectionRequest) => {
  const { videoAnalytics, fusers } = await fetchAnalyticsFromPipeline();
  detectionRequest.analytic_id = videoAnalytics.map((a) => a.id);
  detectionRequest.fuser_id = fusersFor("video", fusers);

  return detect(detectionRequest)
    .then((response) => {
      return response;
    })
    .catch((err) => {
      throw err;
    });
};

exports.getDetectionInfo = (detectionInfoRequest) => {
  return new Promise((resolve, reject) => {
    workflowClient.GetDetectionInfo(detectionInfoRequest, (err, response) => {
      if (err) reject(err);
      resolve(response);
    });
  });
};

exports.getDetectionList = (detectionListRequest) => {
  return new Promise((resolve, reject) => {
    workflowClient.GetDetectionList(detectionListRequest, (err, response) => {
      if (err) reject(err);
      resolve(response);
    });
  });
};

exports.deleteDetection = (deleteDetectionRequest) => {
  return new Promise((resolve, reject) => {
    workflowClient.DeleteDetection(deleteDetectionRequest, (err, response) => {
      if (err) reject(err);
      resolve(response);
    });
  });
};

exports.getAnalyticsList = async () => {
  const analyticsList = await fetchAnalyticsFromPipeline();
  return analyticsList;
};

const init = () => {
  const pipelineDefinition = protoLoader.loadSync("pipeline.proto", {
    keepCase: true,
    defaults: true,
    includeDirs: [protosRoot],
  });

  const workflowProto = grpc.loadPackageDefinition(pipelineDefinition)
    .workflowproto;

  const host = config.get("WORKFLOW_HOST");
  const port = config.get("WORKFLOW_PORT");

  return new workflowProto.Pipeline(
    `${host}:${port}`,
    grpc.credentials.createInsecure()
  );
};

const workflowClient = init();

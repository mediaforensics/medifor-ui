const protoLoader = require("@grpc/proto-loader");
const grpc = require("@grpc/grpc-js");
const config = require("config");
const { protosRoot } = require("../helpers/directories");

exports.updateDetectionTags = (detectionID, replace, tags, deleteTags) => {
  const request = {
    detection_id: detectionID,
    replace,
    tags,
    delete_tags: deleteTags
  };

  return new Promise((resolve, reject) => {
    workflowClient.services.UpdateDetectionTags(request, (err, response) => {
      if (err) reject(err);
      resolve(response);
    });
  });
};

exports.getDetectionTagInfo = (detectionTagRequest, userKey, groupKey) => {
  const request = {
    require_tags: detectionTagRequest,
    skip_prefixes: []
  };

  /* Pipeline will skip and not return any tags prefixed with userKeuy or groupKey */
  if (userKey) request.skip_prefixes.push(userKey);
  if (groupKey) request.skip_prefixes.push(groupKey);

  return new Promise((resolve, reject) => {
    workflowClient.services.GetDetectionTagInfo(request, (err, response) => {
      if (err) reject(err);
      resolve(response);
    });
  });
};

const init = (proto, packageName, service) => {
  const pipelineDefinition = protoLoader.loadSync(proto, {
    includeDirs: [protosRoot],
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true
  });

  const package = grpc.loadPackageDefinition(pipelineDefinition)[packageName];

  const host = config.get("WORKFLOW_HOST");
  const port = config.get("WORKFLOW_PORT");

  const services = new package[service](
    `${host}:${port}`,
    grpc.credentials.createInsecure()
  );

  const messages = Object.entries(package)
    .filter(entry => typeof entry[1] !== "function")
    .map(entry => entry[0]);

  return {
    services,
    messages
  };
};

const workflowClient = init("pipeline.proto", "mediforproto", "Pipeline");

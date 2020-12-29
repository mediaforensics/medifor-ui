const { createTerminus } = require("@godaddy/terminus");

//Terminus functions
const onSignal = () => {
  // your clean logic, like closing database connections
  console.log("server is starting cleanup");
  return Promise.resolve();
};

const onShutdown = () => {
  console.log("cleanup finished, server is shutting down");
};

// Returns a string representing server uptime in hours:minutes:seconds
const formatUptime = uptime =>
  [uptime / (60 * 60), (uptime % (60 * 60)) / 60, uptime % 60]
    .map(Math.floor)
    .map(number => number.toString().padStart(2, 0))
    .join(":");

const healthCheck = () => {
  return Promise.resolve({ uptime: formatUptime(process.uptime()) });
};

const terminusOptions = {
  healthChecks: {
    "/healthcheck": healthCheck, // URL Path and the function indicating service health,
    verbatim: true // [optional = false] use object returned from /healthcheck verbatim in response
  },
  onShutdown: onShutdown,
  onSignal: onSignal
};

module.exports.setupHealthCheck = function(server) {
  createTerminus(server, terminusOptions);
};

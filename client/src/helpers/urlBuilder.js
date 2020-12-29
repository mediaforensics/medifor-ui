/* Need to swap port to 3000 when in development environment
 * Otherwise we resolve to the location in the browser */
function getBaseUrl() {
  let { origin, pathname, port } = window.location;
  if (process.env.NODE_ENV == "development") {
    origin = origin.replace(port, "3000");
  }

  return buildRequest(origin, pathname);
}

function buildRequest(baseUri, path, queryParams) {
  const params = queryParams == undefined ? {} : queryParams;
  var url = new URL(path, baseUri);
  for (let [key, value] of Object.entries(params)) {
    url.searchParams.append(key, value);
  }
  return url.href;
}

export { getBaseUrl, buildRequest };

import axios from "axios";
import store from "@/store/store";
import { buildRequest } from "@/helpers/urlBuilder";

const BASE_URL = store.getters.baseUri;
const tagConfig = {};

const CancelToken = axios.CancelToken;
let cancel;

// Add a response interceptor to catch all errors and set a message for the user to see
axios.interceptors.response.use(
  function(response) {
    // Any status code that lie within the range of 2xx cause this function to trigger
    // Do something with response data
    store.commit("setExternalCallError", "");
    return response;
  },
  function(error) {
    if (error.response && error.response.data) {
      console.error(
        `A error has occured in getting a response: ${error}: ${
          error.response.data.message
        }`
      );
      store.commit("setExternalCallError", error.response.data.message);
    }
    // Any status codes that falls outside the range of 2xx cause this function to trigger
    // Do something with response error
    return Promise.reject(error);
  }
);

function init() {
  updateSystemTags();
}

/* Updates the tagConfig object to hold all information about group tags and current user tag
 * With grouping enabledd, the current group set as 'foo' and user as 'jdoe' it will look like the following 

 * { enabled : "true",
 *   currentUser: "jdoe",
 *   selectedGroup: "foo" ,
 *   systemTagPrefixFlag: "__" },
 *   systemUserTagKey : "__user",
 *   systemGroupTagKey: "__group" ,
 *   groupingEnabled: "true", */

function updateSystemTags() {
  if (!tagConfig.enabled) {
    /* Will always get set to true because all uploads will be tagged by user */
    tagConfig.enabled = true;

    /* Only set once */
    if (tagConfig.enabled === true) {
      tagConfig.systemTagPrefixFlag = store.state.config.tagPrefixFlag;
      tagConfig.groupingEnabled = store.state.config.enableGroups;
    }
  }
  tagConfig.selectedGroup = store.state.user.selectedGroup;
  tagConfig.systemUserTagKey = getSystemTagKeys({ type: "user" });
  tagConfig.systemGroupTagKey = getSystemTagKeys({ type: "group" });
  tagConfig.currentUser = getUser();
}

function getSystemTagKeys({ type }) {
  const {
    tagPrefixFlag: tagPrefix = null,
    groupTagPrefix: groupTag = null,
    userTagPrefix: userTag = null
  } = store.state.config;

  if (type == "group") {
    return tagPrefix && groupTag ? `${tagPrefix}${groupTag}` : null;
  } else if (type == "user") {
    return tagPrefix && groupTag ? `${tagPrefix}${userTag}` : null;
  }
}

function getUser() {
  const { name: username = null } = store.state.user;
  return username;
}

function groupingIsOn() {
  return (
    tagConfig.groupingEnabled &&
    tagConfig.selectedGroup &&
    tagConfig.systemGroupTagKey
  );
}

function userIsDefined() {
  return (
    tagConfig.enabled && tagConfig.systemUserTagKey && tagConfig.currentUser
  );
}

async function getAll() {
  return getPage()
    .then(res => {
      if (store.getters.pageToken === "null") {
        store.commit("setProbes", res.data.detections);
      } else {
        store.commit("appendProbes", res.data.detections);
      }
      /* Get next page token and set it in the store */
      store.commit("setPageToken", res.data.page_token);
      store.commit("setProbeTotal", res.data.total);
      store.commit("setLoading", false);
    })
    .catch(() => {
      /* Do nothing here, this catches cancel tokens. 
      The next function in the call stack getPage() will handle other errors */
    });
}

async function getPage() {
  init();

  const { pageToken, probes, isLoading, queryParameters } = store.getters;
  let tempQuery = { ...queryParameters };

  /* At the end of the gallery scroll */
  if (pageToken == "" && probes !== []) return;
  /* Cancel next request if gallery is still loading */
  if (isLoading && probes.length > 0) cancel && cancel();
  /* If there is a page token then append */
  if (pageToken !== "null") tempQuery.pageToken = pageToken;

  const url = buildRequest(BASE_URL, "probes", tempQuery);

  return axios
    .get(url, {
      cancelToken: new CancelToken(function executor(c) {
        cancel = c;
      })
    })
    .then(function(d) {
      return d;
    })
    .catch(function(thrown) {
      if (!axios.isCancel(thrown)) {
        console.error(thrown);
        throw thrown;
      }
    });
}

async function uploadProbe(formData) {
  init();
  let uploadQuery = {};

  /* Append the currently selected group to the request query string */
  if (groupingIsOn()) {
    uploadQuery.group = `${tagConfig.selectedGroup}_`;
  }

  const url = buildRequest(BASE_URL, "upload", uploadQuery);
  let probeArr = [];
  let allProbes = formData.getAll("probe");
  let tags = formData.get("tags");
  let temptag = tags;
  tags.trim();

  for (const probe of allProbes) {
    var fd = new FormData();
    fd.set("probe", probe);
    fd.set("tags", tags);

    /* Append user tag to user-added tags */
    if (userIsDefined()) {
      fd.set(tagConfig.systemUserTagKey, tagConfig.currentUser);
    }
    /* Append group tag to user-added tags */
    if (groupingIsOn()) {
      fd.set(tagConfig.systemGroupTagKey, tagConfig.selectedGroup);
    }

    tags = temptag;

    try {
      let p = await axios.post(url, fd);
      probeArr.push(p.data);
      store.commit("setUploadProgress", store.getters.uploadProgress + 1);
    } catch (error) {
      console.log(error);
    }
  }

  store.commit("resetUpload");
  // start loading after upload
  return probeArr;
}

function uploadFromURL(url, tags) {
  init();
  let uploadQuery = {};
  /* Append the currently selected group to the request query string */
  if (groupingIsOn()) {
    uploadQuery.group = `${tagConfig.selectedGroup}_`;
  }
  const base_url = buildRequest(BASE_URL, "uploadURL");
  const payload = {
    uploadUrl: url,
    tags: tags == undefined ? undefined : tags.join(",")
  };
  if (userIsDefined()) {
    payload[tagConfig.systemUserTagKey] = tagConfig.currentUser;
  }
  if (groupingIsOn()) {
    payload[tagConfig.systemGroupTagKey] = tagConfig.selectedGroup;
  }

  return axios.post(base_url, payload);
}

function probeInfo(filename, fused) {
  const includefused = fused ? 1 : 0;
  const path = `probes/${filename}`;
  const queryParams = {
    includefused: includefused,
    fuser_id: store.getters.fusionModel
  };
  const url = buildRequest(BASE_URL, path, queryParams);
  return axios.get(url);
}

/* --- Labels --- */

function getLabels(labels = "") {
  init();

  /* Append the currently selected group tag to the selected user-added tags
   * Append the current user tag to the selected user-added tags
   * This will filter down labels and only include labels that coexist with the current labels and current group */

  /* If user wants own media and user defined */
  if (store.getters.userSelectedMedia && userIsDefined()) {
    const appendedUserTag = `${tagConfig.systemUserTagKey}=${
      tagConfig.currentUser
    }`;
    if (labels) labels = `${labels},${appendedUserTag}`;
    else labels = appendedUserTag;
  }

  if (groupingIsOn()) {
    const appendedGroupTag = `${tagConfig.systemGroupTagKey}=${
      tagConfig.selectedGroup
    }`;
    if (labels) labels = `${labels},${appendedGroupTag}`;
    else labels = appendedGroupTag;
  }
  const url = buildRequest(BASE_URL, "tags", { tagsForFiltering: labels });

  return axios.get(url);
}

function updateTags(id, tags) {
  const path = `probes/${id}/tags/`;
  const url = buildRequest(BASE_URL, path);
  const config = {
    headers: {
      "Content-Type": "application/json"
    }
  };

  if (tags.length !== "") return axios.put(url, { tags: tags }, config);
  return axios.patch(url, config);
}
function deleteTag(id, tag) {
  const path = `probes/${id}/tags/`;
  const url = buildRequest(BASE_URL, path);
  return axios.delete(url, { data: { tags: tag } });
}
function getAnalyticList() {
  const url = buildRequest(BASE_URL, "analytics");
  return axios.get(url);
}

function getFacetInfo() {
  const url = buildRequest(BASE_URL, "facets");
  return axios.get(url);
}

export {
  getAll,
  uploadProbe,
  uploadFromURL,
  probeInfo,
  getAnalyticList,
  getLabels,
  updateTags,
  deleteTag,
  getFacetInfo
};

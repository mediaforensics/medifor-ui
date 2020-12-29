import axios from "axios";
import { buildRequest } from "@/helpers/urlBuilder";

const state = {
  groupPrefix: null,
  unknownUsers: "deny", // Indicates how to handle unknown users ( "deny" | "allow")
  enableGroups: false,
  enableDelete: true,
  userTagPrefix: null,
  groupTagPrefix: null,
  tagPrefixFlag: null,
  uploadedByTag: "uploadedBy"
};

const actions = {
  loadConfig({ commit, getters }) {
    const url = buildRequest(getters.baseUri, "config");
    return axios
      .get(url)
      .then(response => response.data)
      .then(data => {
        commit("SET_CONFIG", data);
        commit(
          "setDefaultFusionModel",
          data.defaultFuserId ? data.defaultFuserId : ""
        );
        commit(
          "setFusionModel",
          data.defaultFuserId ? data.defaultFuserId : ""
        );
      })
      .catch(error => {
        console.log("There was an error getting the config", error);
      });
  }
};

const mutations = {
  SET_CONFIG(
    state,
    // Ensure a value is passed ( uses default values if not previously set)
    {
      enableGroups = false,
      enableDelete = true,
      unknownUsers = "deny",
      groupPrefix = null,
      groupTagPrefix = null,
      userTagPrefix = null,
      tagPrefixFlag = null
    }
  ) {
    /* enableGroups will be string 'false' in K8s setup, must typecast to Boolean */
    state.enableGroups = JSON.parse(enableGroups);
    state.enableDelete = JSON.parse(enableDelete);
    state.unknownUsers = unknownUsers;
    state.groupPrefix = groupPrefix;
    state.groupTagPrefix = groupTagPrefix;
    state.userTagPrefix = userTagPrefix;
    state.tagPrefixFlag = tagPrefixFlag;
  }
};

const getters = {
  enableGroups: state => state.enableGroups,
  groupTagPrefix: state => state.groupTagPrefix,
  userTagPrefix: state => state.userTagPrefix,
  tagPrefixFlag: state => state.tagPrefixFlag
};

export default {
  state,
  actions,
  mutations,
  getters
};

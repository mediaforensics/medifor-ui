import axios from "axios";
import { buildRequest } from "@/helpers/urlBuilder";

const state = {
  name: "",
  groups: [],
  displayName: "",
  selectedGroup: "",
  isAdmin: false
};

const getters = {
  name: state => state.name,
  groups: state => state.groups,
  selectedGroup: state => state.selectedGroup
};

const actions = {
  loadUser({ commit, getters, rootState }) {
    const url = buildRequest(getters.baseUri, "user");
    return axios
      .get(url)
      .then(response => response.data)
      .then(data => {
        const { groupPrefix } = rootState.config;
        const { user } = data;
        commit("SET_USER", { user, groupPrefix });
      })
      .catch(error => {
        console.log("There was an error getting the user", error);
      });
  },

  //initial group set when setting the user
  setPreferredGroup({ commit, state }, group) {
    if (state.selectedGroup != group) {
      commit("SET_SELECTED_GROUP", group);
    }
  }
};

const mutations = {
  SET_USER(state, { user, groupPrefix }) {
    const { displayName, groups = [], name, admin = false } = user;

    state.displayName = displayName;
    state.groups = groups
      .filter(group => group.startsWith(groupPrefix) && group !== groupPrefix)
      .map(group => group.replace(groupPrefix, ""));
    state.name = name;
    state.selectedGroup = state.groups.length > 0 ? state.groups[0] : null;
    state.isAdmin = admin;
  },

  SET_SELECTED_GROUP(state, group) {
    state.selectedGroup = group;
  }
};

export default {
  state,
  getters,
  actions,
  mutations
};

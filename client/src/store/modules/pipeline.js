// Pipeline module handles probe data coming and going to the pipe
// selected probe/masks, data from probe, tags, all probes, etc
// if it calls the pipeline, it goes here.

import store from "../store";
import * as probeService from "@/components/services/ProbeService";
import { getPreference } from "@/helpers/userPreferences";

const state = {
  probes: [],
  probe: null,
  selectedAnalytic: "",
  maskUrl: "",
  labels: [],
  defaultFusionModel: "",
  fusionModel: "",
  filterLabels: [],
  defaultFilterLabels: [],
  uploadTotal: Number,
  uploadProgress: Number,
  isLoading: false,
  analyticList: { imageAnalytics: [], videoAnalytics: [], fusers: [] },
  probeTotal: 0,
  filteredTotal: Number,
  downloadValue: "",
  facetInfo: {},
  externalCallError: "",
  userSelectedMedia: false
};

const getters = {
  getFriendly: state => id => {
    const lst = [
      ...state.analyticList.imageAnalytics,
      ...state.analyticList.videoAnalytics,
      ...state.analyticList.fusers
    ];

    return lst.find(a => a.id === id);
  },

  imageSelected: state => {
    return (
      state.probe &&
      state.probe.analytic_info &&
      state.probe.analytic_info[0].detection.img_manip !== undefined
    );
  },
  meta: state => state.probe && state.probe.meta,
  probe: state => state.probe,
  labels: state => state.labels,
  probes: state => state.probes,
  maskUrl: state => state.maskUrl,
  labelSys: state => state.labels.tag_counts,
  facetInfo: state => state.facetInfo,
  isLoading: state => state.isLoading,
  labelUser: state => state.labels.user_tag_counts,
  probeTotal: state => state.probeTotal,
  uploadTotal: state => state.uploadTotal,
  fusionModel: state => state.fusionModel,
  analyticList: state => state.analyticList,
  filterLabels: state => state.filterLabels,
  probesLength: state => state.probes.length,
  filteredTotal: state => state.filteredTotal,
  downloadValue: state => state.downloadValue,
  uploadProgress: state => state.uploadProgress,
  selectedAnalytic: state => state.selectedAnalytic,
  userSelectedMedia: state => state.userSelectedMedia,

  queryParameters(state) {
    const {
      enableGroups,
      selectedGroup,
      groupTagPrefix,
      tagPrefixFlag,
      userTagPrefix,
      name: username
    } = store.getters;

    let tags = state.filterLabels.join(",");

    /* If grouping is enabled then append the current groupTag to the user selected tags in the URL query params */
    if (enableGroups && groupTagPrefix) {
      const systemGroupTag = `${tagPrefixFlag}${groupTagPrefix}=${selectedGroup}`;
      tags = tags == "" ? systemGroupTag : `${tags},${systemGroupTag}`;
    }
    /* If user wants own media and user is defined append user tag to filter labels*/
    if (state.userSelectedMedia && userTagPrefix && username) {
      const systemUserTag = `${tagPrefixFlag}${userTagPrefix}=${username}`;
      tags = tags == "" ? systemUserTag : `${tags},${systemUserTag}`;
    }

    return {
      tags: tags,
      wantfused: 1,
      pagesize: 100,
      dir: store.getters.sortDir,
      fuser_id: state.fusionModel,
      column: store.getters.sortField,
      fusion_threshold_type: store.getters.scoreDir,
      fusion_threshold_value: store.getters.scoreThreshold / 100
    };
  }
};

const actions = {
  fetchAnalyticList({ commit }) {
    return probeService.getAnalyticList().then(list => {
      commit("setAnalyticList", list.data);
    });
  },
  fetchFacetInfo: async context => {
    const info = await probeService.getFacetInfo();
    context.commit("setFacetInfo", info.data);
  },
  getProbes({ commit, dispatch }, resetPageToken = true) {
    if (resetPageToken) {
      commit("resetPageToken");
    }
    commit("setLoading", true);
    dispatch("getLabels"); //We can do this without waiting on it
    return probeService.getAll().then(prev => {
      return prev;
    });
  },
  selectProbe: async (context, payload) => {
    // update info from probe
    let updatedInfo = await probeService.probeInfo(
      payload.probe.id,
      payload.include_fused
    );

    if (updatedInfo.status == 200) {
      // get probe + detections success, change state
      context.commit("selectProbe", updatedInfo.data); //.detections[0]
    } else {
      console.error("Could not select probe: " + payload.probe);
    }
  },
  getLabels: context => {
    /* Create list of currently selected filter tags which pipeline will filter with coexisting tags */
    const labels = context.state.filterLabels.join();
    probeService.getLabels(labels).then(res => {
      if (res.status == 200) {
        context.commit("setLabels", res.data);
      } else {
        console.error("Could not retrieve labels");
      }
      return res.data;
    });
  }
};

const mutations = {
  setUserSelectedMedia(state, value) {
    state.userSelectedMedia = value;
  },
  setDefaultFilterLabels(state) {
    const defaultId = state.defaultFusionModel;
    store.commit("handleFilters", defaultId);

    /* The defaultFilterLabels will be identical to the initial filterLabels after
     * call to the above method */
    state.defaultFilterLabels = state.filterLabels;
  },
  setUserPreferences(state) {
    const currentPreferences = {
      fusionModel: getPreference("fusionModel"),
      column: getPreference("column"),
      direction: getPreference("direction")
    };

    const listHasPreference = state.analyticList.fusers.find(
      fuser => fuser.id == currentPreferences.fusionModel
    );

    /* This will write over the initial filter labels when the app loads
     * The default labels will remain the same when the user 'resets' the filters in the UI
     *
     * The user preferred fusionModel has to exist in the list for it to be set */
    if (
      currentPreferences.fusionModel &&
      !!listHasPreference &&
      !!state.fusionModel
    ) {
      const id = currentPreferences.fusionModel;
      store.commit("setFusionModel", id);
      store.commit("handleFilters", id);
    }

    if (currentPreferences.column && currentPreferences.direction) {
      const { direction, column } = currentPreferences;
      store.dispatch("setSort", { direction: direction, field: column });
    }
  },
  handleFilters(state, id) {
    const fuser = state.analyticList.fusers.find(f => f.id == id);
    if (fuser) {
      const handleValues = fuser.handles.map(value => `type=${value}`);

      /* Can only send one system tag at a time due to AND logic
       * If the fusion model handles more than one media type
       * filter labels must be empty to be able to get ALL
       * media types */
      const handles = handleValues.length > 1 ? [] : handleValues;
      store.commit("applyFilters", handles);
    } else {
      store.commit("applyFilters", []);
    }
  },
  unselectAll(state) {
    state.probe = null;
  },
  setProbes(state, probes) {
    state.probes = probes;
  },
  appendProbes(state, probes) {
    state.probes = state.probes.concat(probes);
  },
  selectProbe(state, probe) {
    if (state.probe !== null && state.probe.id === probe.id) {
      state.probe = probe;
      return;
    }
    state.probe = probe;
    // reset analytic data
    state.selectedAnalytic = "";
    state.maskUrl = "";
  },
  setLoading(state, loading) {
    if (state.isLoading !== loading) {
      state.isLoading = loading;
    }
  },
  /* If there is no defaultFuser from previously set config file then choose first fuser in list */
  setAnalyticList(state, aList) {
    const { fusers } = aList;
    if (state.defaultFusionModel == "" && fusers.length > 0) {
      state.defaultFusionModel == fusers[0].id;
      state.fusionModel = fusers[0].id;
    }
    state.analyticList = aList;
  },
  setFacetInfo(state, info) {
    state.facetInfo = info;
  },
  setExternalCallError(state, message) {
    state.externalCallError = message;
  },
  selectMask(state, url) {
    state.maskUrl = url;
  },
  selectAnalytic(state, name) {
    state.selectedAnalytic = name;
  },
  setLabels(state, labelArr) {
    state.labels = labelArr;
  },
  clearSearchFilters(state) {
    state.filterLabels = [];
    state.sortField = "createdAt";
    state.sortDir = "asc";
  },
  applyFilters(state, tags) {
    state.filterLabels = tags;
  },
  resetAll(state) {
    state.sortField = "createdAt";
    state.sortDir = "asc";
  },
  //upload visuals
  resetUpload(state) {
    state.uploadTotal = 0;
    state.uploadProgress = 0;
  },
  setUploadTotal(state, total) {
    state.uploadTotal = total;
    state.uploadProgress = 0;
  },
  setUploadProgress(state, prog) {
    state.uploadProgress = prog;
  },
  setProbeTotal(state, probeCount) {
    state.probeTotal = probeCount;
  },
  setFilteredTotal(state, filteredCount) {
    state.filteredTotal = filteredCount;
  },
  setDownloadValue(state, download) {
    state.downloadValue = download;
  },
  setDefaultFusionModel(state, fusionModel) {
    state.defaultFusionModel = fusionModel;
  },
  setFusionModel(state, fusionModel) {
    state.fusionModel = fusionModel;
  }
};

export default {
  state,
  getters,
  actions,
  mutations
};

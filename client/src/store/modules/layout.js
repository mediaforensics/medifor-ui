// Layout module handles which components to show
// active selections, toggles, and other layout state vars

import * as cGradient from "@/helpers/colorGradients";
import { getBaseUrl } from "@/helpers/urlBuilder";

const state = {
  scoreDir: 0, // probes above (1) or below (-1)  a score
  sortDir: "-1", // asc | desc
  pageSize: 100, // how many probes to load at a time
  zoomState: 100,
  selectedMenu: "", // "" | Upload | Filters | Settings
  pageToken: "null",
  maskOpacity: 0.75, // 0-1 opacity sliders linked here
  galleryMode: "grid", // grid | table
  maskThreshold: 0.5, // similar to opacity
  scoreThreshold: 60, // only show probes past a certain score
  analyticSortDir: -1, // 1 asc, -1 desc
  allowGroupView: true, // If the user is given shareable link and user is member of group from link
  importModalView: false,
  analyticSortField: "score", // "name" or "score"
  sortField: "File:UploadDate", // createdAt | SUBJECT TO CHANGE
  colormap: cGradient.spectral // default greyscale
};

const getters = {
  sortDir: state => state.sortDir,
  scoreDir: state => state.scoreDir,
  pageSize: state => state.pageSize,
  colormap: state => state.colormap,
  sortField: state => state.sortField,
  pageToken: state => state.pageToken,
  galleryMode: state => state.galleryMode,
  maskOpacity: state => state.maskOpacity,
  selectedMenu: state => state.selectedMenu,
  maskThreshold: state => state.maskThreshold,
  scoreThreshold: state => state.scoreThreshold,
  analyticSortDir: state => state.analyticSortDir,
  analyticSortField: state => state.analyticSortField,
  baseUri: () => {
    return getBaseUrl();
  }
};

const actions = {
  //initial group set when setting the user
  setSort({ commit }, sort) {
    const { field, direction } = sort;
    commit("applySortField", field);
    commit("applySortDir", direction);
  }
};

const mutations = {
  applySortField(state, field) {
    var validFields = [
      "filename",
      "File:FileName",
      "detectionId",
      "createdAt",
      "File:UploadDate",
      "score"
    ];
    if (validFields.indexOf(field) >= 0) {
      state.sortField = field;
    } else {
      console.error("invalid sort field: " + field);
    }
  },
  applySortDir(state, dir) {
    if (dir === "asc" || dir === "desc") {
      dir === "asc" ? (state.sortDir = 1) : (state.sortDir = -1);
    } else state.sortDir = dir;
  },
  setAnalyticSortDir(state, dir) {
    state.analyticSortDir = dir;
  },
  setAnalyticSortField(state, field) {
    if (["score", "name", "mask"].indexOf(field) >= 0)
      state.analyticSortField = field;
    else console.error("Invalid sort field name");
  },
  toggleSortDir(state) {
    state.sortDir = state.sortDir === "1" ? "-1" : "1";
  },
  calculateZoomState(state, e) {
    var scrollSpeed = e.deltaY;
    while (Math.abs(scrollSpeed) > 10)
      scrollSpeed = Math.floor(scrollSpeed / 10);

    state.zoomState -= scrollSpeed * Math.floor(state.zoomState / 50);
    state.zoomState =
      state.zoomState <= 100
        ? 100
        : state.zoomState >= 500
        ? 500
        : state.zoomState;
  },
  handleZoomIn(state) {
    state.zoomState += 50;
    state.zoomState = Math.min(state.zoomState, 500);
  },
  handleZoomOut(state) {
    state.zoomState -= 50;
    state.zoomState = Math.max(state.zoomState, 100);
  },
  resetZoomState(state) {
    state.zoomState = 100;
  },
  setAllowGroupView(state, allowed) {
    state.allowGroupView = allowed;
  },
  setImportModalView(state, value) {
    state.importModalView = value;
  },

  selectMenu(state, menu) {
    if (state.selectedMenu === menu) {
      state.selectedMenu = "";
      return;
    }
    var validMenus = [
      "Upload",
      "Filters",
      "Settings",
      "Download",
      "Import",
      "Fusion"
    ];
    if (validMenus.indexOf(menu) >= 0) {
      state.selectedMenu = menu;
    } else if (menu === "") {
      state.selectedMenu = "";
    } else {
      console.error("Invalid Menu: " + menu);
    }
  },
  setOpacity(state, op) {
    state.maskOpacity = op;
  },
  setScoreThreshold(state, thresh) {
    state.scoreThreshold = thresh;
  },
  setScoreDir(state, dir) {
    state.scoreDir = dir;
  },

  selectColormap(state, map) {
    const maps = [
      "greyscale",
      "invertedgreyscale",
      "cividis",
      "viridis",
      "inferno",
      "spectral"
    ];

    state.colormap = maps.includes(map) ? cGradient[map] : cGradient[maps[0]];
  },
  setPageSize(state, size) {
    state.pageSize = size;
  },
  setPageToken(state, token) {
    state.pageToken = token;
  },
  resetPageToken(state) {
    state.pageToken = "null";
  }
};

export default {
  state,
  getters,
  actions,
  mutations
};

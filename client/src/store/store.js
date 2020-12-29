import Vue from "vue";
import Vuex from "vuex";

import layout from "./modules/layout";
import pipeline from "./modules/pipeline";
import user from "./modules/user";
import config from "./modules/config";

Vue.use(Vuex);

const store = new Vuex.Store({
  modules: {
    layout,
    pipeline,
    user,
    config
  }
});

export default store;

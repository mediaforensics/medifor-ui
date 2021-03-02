import Vue from "vue";
import Router from "vue-router";
import store from "./store/store";
import routes from "@/routes/routes.js";
import AppContainer from "./AppContainer.vue";

import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import { library } from "@fortawesome/fontawesome-svg-core";

Vue.use(Router);

const router = new Router({
  routes
});

import {
  faAngleDown,
  faBars,
  faCaretDown,
  faCaretLeft,
  faCaretRight,
  faCaretUp,
  faCheckCircle,
  faCloudUploadAlt,
  faCog,
  faCompress,
  faDownload,
  faExclamationCircle,
  faExpand,
  faExpandArrowsAlt,
  faFilter,
  faImage,
  faInfoCircle,
  faList,
  faMinus,
  faMinusCircle,
  faPauseCircle,
  faPlayCircle,
  faPlus,
  faPlusCircle,
  faRedo,
  faSpinner,
  faStream,
  faTh,
  faTimes,
  faTrashAlt,
  faUndo,
  faUpload,
  faVideo,
  faVolumeMute,
  faVolumeUp
} from "@fortawesome/free-solid-svg-icons";

library.add(
  faAngleDown,
  faBars,
  faCaretDown,
  faCaretLeft,
  faCaretRight,
  faCaretUp,
  faCheckCircle,
  faCloudUploadAlt,
  faCog,
  faCompress,
  faDownload,
  faExclamationCircle,
  faExpand,
  faExpandArrowsAlt,
  faFilter,
  faImage,
  faInfoCircle,
  faList,
  faMinus,
  faMinusCircle,
  faPauseCircle,
  faPlayCircle,
  faPlus,
  faPlusCircle,
  faRedo,
  faSpinner,
  faStream,
  faTh,
  faTimes,
  faTrashAlt,
  faUndo,
  faUpload,
  faVideo,
  faVolumeMute,
  faVolumeUp
);

Vue.component("font-awesome-icon", FontAwesomeIcon);

Vue.config.productionTip = false;

require("./assets/main.scss");

export default new Vue({
  el: "#app",
  router,
  store,
  render: h => h(AppContainer)
});

import Vue from "vue";
import Router from "vue-router";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import { library } from "@fortawesome/fontawesome-svg-core";

import App from "./App.vue";
import store from "./store/store";
import AppContainer from "./AppContainer.vue";
import Supplemental from "./Supplemental.vue";
import ProbeContainer from "./components/ProbeViewer/ProbeContainer";
import UploadContainer from "./components/Upload/UploadContainer";
import GalleryContainer from "./components/Gallery/GalleryContainer";

Vue.use(Router);

const routes = [
  {
    path: "/supplemental",
    component: Supplemental,
    name: "supplemental"
  },
  {
    path: "/",
    component: App,
    name: "app",
    children: [
      {
        path: "/gallery",
        name: "gallery",
        components: {
          gallery: GalleryContainer
        }
      },
      /* ProbeContainer and GalleryContainer are sibling components but to render them simultaneously they must
       * be render through 'named-views' */
      {
        path: "/gallery/probe/:id",
        name: "probe",
        components: {
          probe: ProbeContainer,
          gallery: GalleryContainer
        }
      },
      {
        path: "/upload",
        name: "upload",
        components: {
          upload: UploadContainer
        }
      }
    ]
  }
];

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

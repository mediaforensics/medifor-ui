<template>
  <div class="probe-container">
    <div class="header">
      <div class="manipulations">
        <!-- Zoom -->
        <div v-if="parsedProbe.isImage" class="buttons has-addons">
          <button class="button is-small" @click="zoomOut" title="Zoom Out">
            <font-awesome-icon icon="minus" />
          </button>
          <button
            class="button is-small zoomDisplay"
            title="Reset Zoom"
            @click="resetTransform"
          >
            {{ parseInt(zoomState) }}%
          </button>
          <button class="button is-small" @click="zoomIn" title="Zoom In">
            <font-awesome-icon icon="plus" />
          </button>
        </div>

        <div class="control" v-if="imageSelected">
          <button
            class="button is-small"
            title="View Fullscreen"
            @click="fullScreen()"
          >
            <font-awesome-icon icon="expand-arrows-alt" />
          </button>
        </div>

        <!--Rotate 90d CCW - CW only show if image seelcted-->
        <div class="control has-icons-left" v-if="imageSelected">
          <button
            class="button is-small"
            @click="rotateLeft"
            title="Rotate 90 degrees CCW"
          >
            <font-awesome-icon icon="undo" />
          </button>
          <button
            class="button is-small"
            @click="rotateRight"
            title="Rotate 90 degrees CW"
          >
            <font-awesome-icon icon="redo" />
          </button>
        </div>

        <!-- Colorgrading Legend if mask selected-->
        <div v-if="maskUrl !== '' || !imageSelected" class="has-addons ">
          <div class="control has-icons-left">
            <div class="select is-small">
              <select
                name="colormaps"
                id="colormapSelect"
                v-model="colormap"
                @change="changeColormap($event)"
              >
                <option
                  v-for="mode in colormaps"
                  :key="mode.map"
                  :value="mode.map"
                >
                  {{ mode.name }} <span class="grad"></span>
                </option>
              </select>
            </div>
            <div class="icon is-left grad" :style="gradientStyle"></div>
          </div>
        </div>

        <OpacitySlider
          :showLabel="true"
          v-if="imageSelected && maskUrl !== ''"
        />

        <!-- View Mode if image is selected-->
        <div
          class="viewmode has-icons-left"
          v-if="imageSelected && maskUrl !== ''"
        >
          <label for="viewMode">Layout</label>
          <div class="select is-small">
            <select name="viewMode" v-model="viewMode">
              <option v-for="mode in viewModes" :key="mode" :value="mode">{{
                mode
              }}</option>
            </select>
          </div>
        </div>
      </div>

      <div class="actions">
        <div class="sorting as-addons">
          <label for="analyticSort">Sort</label>
          <div class="select is-small">
            <select
              name="analyticSort"
              id="analyticSort"
              @change="changeAnalyticSort($event)"
            >
              <option
                value="score"
                :selected="$store.getters.analyticSortField === 'score'"
                >Integrity</option
              >
              <option
                value="name"
                :selected="$store.getters.analyticSortField === 'name'"
                >Name</option
              >
              <option
                value="mask"
                :selected="$store.getters.analyticSortField === 'mask'"
                >Mask</option
              >
            </select>
          </div>
        </div>

        <dl class="download-options">
          <dt class="download-options__title">Download</dt>
          <dd class="download-options__option">
            <a :href="reportURL(REPORT_TYPE.PDF)" target="_blank">PDF</a>
          </dd>
          <dd class="download-options__option">
            <a :href="reportURL(REPORT_TYPE.CSV)">CSV</a>
          </dd>
          <dd v-if="parsedProbe.isImage" class="download-options__option">
            <a
              :href="pathToOriginalProbe"
              :download="originalFileName"
              target="_blank"
              >Image</a
            >
          </dd>
          <dd v-if="parsedProbe.isVideo" class="download-options__option">
            <a
              :href="pathToOriginalProbe"
              :download="originalFileName"
              target="_blank"
              >Video</a
            >
          </dd>
        </dl>

        <div v-if="allowDelete" title="Delete Probe">
          <button
            class="button is-small is-text"
            @click="
              () => {
                this.showModal = true;
              }
            "
          >
            <font-awesome-icon
              class="fa-2x"
              style="color:rgb(32,156,238)"
              icon="trash-alt"
            />
          </button>
        </div>

        <div title="Close Window">
          <router-link :to="{ name: 'gallery', query: this.queryParameters }">
            <button class="button is-small is-text" @click="closeWindow">
              <font-awesome-icon class="fa-2x" icon="times" />
            </button>
          </router-link>
        </div>
      </div>
    </div>

    <!-- ProbeView -->
    <!-- handleNoZoom prevents the entire app from zooming -->
    <div class="probe-viewer" @wheel.prevent="handleNoZoom($event)">
      <ProbeView
        :zoomState="zoomState"
        :zoomToggle="zoomToggle"
        :fullScreenToggle="fullScreenToggle"
        :rotateState="rotateState"
        :viewMode="viewMode"
      />
    </div>

    <div class="details">
      <DetailsView />
    </div>

    <!-- Modal for deleting probe -->
    <div class="modal" :class="{ 'is-active': this.showModal }">
      <div class="modal-background">
        <div class="modal-card" style="top: 40%; ">
          <header class="modal-card-head">
            <p class="modal-card-title"></p>
            <button
              class="delete"
              aria-label="close"
              @click="() => (this.showModal = false)"
            ></button>
          </header>
          <section class="modal-card-body">
            <h3>Are you sure you want to delete the selected probe?</h3>
          </section>
          <footer class="modal-card-foot">
            <router-link :to="{ name: 'gallery', query: this.queryParameters }">
              <button class="button is-danger" @click="deleteProbe">
                Delete
              </button>
            </router-link>
            <button
              style="margin-left: 10px;"
              class="button"
              @click="() => (this.showModal = false)"
            >
              Cancel
            </button>
          </footer>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { setPreference, getPreference } from "@/helpers/userPreferences";
import { mapGetters, mapState, mapMutations, mapActions } from "vuex";
import { probeParserMixin } from "../../mixins/probeParserMixin";
import { buildRequest } from "@/helpers/urlBuilder";

import * as axios from "axios";
import DetailsView from "./DetailsView.vue";
import OpacitySlider from "../common/OpacitySlider";
import ProbeView from "./ProbeView.vue";

export default {
  name: "ProbeContainer",
  components: {
    DetailsView,
    OpacitySlider,
    ProbeView
  },

  mixins: [probeParserMixin],

  data: function() {
    return {
      base_uri: this.$store.getters.baseUri,
      newLabels: "",
      rotateState: 0,
      viewMode: "overlay",
      viewModes: ["overlay", "horizontal", "vertical"], //, "zoom"
      colormap: "spectral",
      colormaps: [
        { name: "Cividis", map: "cividis" },
        { name: "Grey Scale - W/B", map: "greyscale" },
        { name: "Grey Scale - B/W", map: "invertedgreyscale" },
        { name: "Inferno", map: "inferno" },
        { name: "Viridis", map: "viridis" },
        { name: "Spectral", map: "spectral" }
      ],
      zoomToggle: true,
      REPORT_TYPE: {
        CSV: 1,
        PDF: 2
      },
      fullScreenToggle: true,
      showModal: false
    };
  },

  computed: {
    ...mapState({
      isAdmin: state => state.user.isAdmin,
      username: state => state.user.name,
      probe: state => state.pipeline.probe,
      probes: state => state.pipeline.probes,
      zoomState: state => state.layout.zoomState,
      enableDelete: state => state.config.enableDelete,
      fusionModel: state => state.pipeline.fusionModel,
      tagPrefixFlag: state => state.config.tagPrefixFlag,
      userTagPrefix: state => state.config.userTagPrefix
    }),
    ...mapGetters(["imageSelected", "maskUrl", "queryParameters", "baseUrl"]),
    meta() {
      return this.$store.getters.probe == null ? {} : this.$store.getters.meta;
    },

    gradientStyle: function() {
      var grad = this.$store.getters.colormap;
      var linGrad = "linear-gradient(to left,";
      // add each color step
      for (const color of grad) {
        linGrad += `rgb(${color[0]},${color[1]},${color[2]}),`;
      }
      // remove last comma
      linGrad = linGrad.substring(0, linGrad.length - 1);
      return {
        background: `${linGrad})`
      };
    },
    /* Only display the delete option if currently selected probe was uploaded by the current user */
    probeIsUsers: function() {
      /* If user tagging isn't defined in the config with these values then dont show button */
      if (!(!!this.tagPrefixFlag && !!this.userTagPrefix)) return false;

      /* Compare current user to uploaded for selected probe */
      /* Dont display if uploadingUser is undefined */

      const userTag = `${this.tagPrefixFlag}${this.userTagPrefix}`;
      const uploadingUser = this.probe.tags[userTag];
      return uploadingUser ? uploadingUser == this.username : false;
    },
    allowDelete: function() {
      return (this.probeIsUsers && this.enableDelete) || this.isAdmin;
    },
    buildPath: function() {
      const id = this.probe.id;
      return {
        path: `probes/${id}`,
        fusion: this.fusionModel,
        base_uri: this.base_uri
      };
    },

    pathToOriginalProbe() {
      return this.parsedProbe.isImage
        ? this.parsedProbe.source
        : this.parsedProbe.originalSource;
    },
    originalFileName() {
      return this.parsedProbe.name;
    }
  },
  watch: {
    probe(current, previous) {
      if (current.id != previous.id) {
        this.resetTransform();
      }
    },
    viewMode() {
      this.resetZoomState();
    }
  },
  mounted() {
    this.$store.subscribe(mutation => {
      switch (mutation.type) {
        case "selectMask":
          if (this.viewMode !== "overlay") this.blendMode = "normal";
          if (!this.maskUrl) this.viewMode = "overlay";
          break;
      }
    });

    /* If user had colormap selected form prior session */
    if (getPreference("colormap")) {
      const preferredMap = getPreference("colormap");
      this.colormap = preferredMap;
      this.selectColormap(preferredMap);
    }
  },
  /*eslint no-unused-vars: ["error", { "args": "none" }]*/
  methods: {
    ...mapMutations([
      "handleZoomIn",
      "handleZoomOut",
      "resetZoomState",
      "unselectAll",
      "selectColormap",
      "setProbes"
    ]),
    ...mapActions(["selectProbe"]),
    rotateRight() {
      this.rotateState = (this.rotateState + 1) % 4;
    },
    rotateLeft() {
      this.rotateState = this.rotateState == 0 ? 3 : this.rotateState - 1;
    },
    resetTransform() {
      if (this.maskUrl == "") this.viewMode = "overlay";
      this.resetZoomState();
      this.zoomToggle = !this.zoomToggle;
    },
    zoomIn() {
      this.handleZoomIn();
      this.zoomToggle = !this.zoomToggle;
    },
    zoomOut() {
      this.handleZoomOut();
      this.zoomToggle = !this.zoomToggle;
    },
    handleNoZoom(e) {},
    closeWindow() {
      this.unselectAll();
    },
    fullScreen() {
      this.fullScreenToggle = !this.fullScreenToggle;
    },
    formatPercent() {
      return Math.floor(this.$store.getters.detections.fused_score * 100);
    },
    changeColormap(event) {
      this.selectColormap(event.target.value);
      setPreference("colormap", event.target.value);
    },
    changeAnalyticSort(event) {
      let val = event.target.value;
      if (val == "name") {
        this.$store.commit("setAnalyticSortField", val);
        this.$store.commit("setAnalyticSortDir", 1);
      } else if (val == "score") {
        this.$store.commit("setAnalyticSortField", val);
        this.$store.commit("setAnalyticSortDir", -1);
      } else if (val == "mask") {
        this.$store.commit("setAnalyticSortField", val);
        this.$store.commit("setAnalyticSortDir", -1);
      } else {
        alert("ERROR");
      }
    },
    reportURL(val) {
      const { path, fusion, base_uri } = this.buildPath;
      const params =
        val == this.REPORT_TYPE.PDF
          ? { fuser_id: fusion, pdf: "yes" }
          : { includefused: 1, fuser_id: fusion, csv: "yes" };
      return buildRequest(base_uri, path, params);
    },
    /* Delete probe, close window and remove probe from gallery */
    deleteProbe() {
      const { path, base_uri } = this.buildPath;
      const id = this.probe.id;
      const url = `${base_uri}${path}`;
      axios
        .delete(url)
        .then(response => {
          const filteredProbes = this.probes.filter(probe => {
            return probe.id != id;
          });
          alert(response.data);
          this.setProbes(filteredProbes);
          this.closeWindow;
        })
        .catch(err => alert(err.response.data));
    }
  }
};
</script>

<style scoped>
label {
  padding-inline-end: 0.2rem;
}

.probe-container {
  --control-gap: 8px;

  height: 100%;
  padding: 0;
  margin: 0;
  overflow-y: auto;
  overflow-x: hidden;
  background: #eee;
  display: grid;
  grid-template-rows: auto 1fr;
  grid-template-columns: 1fr 400px;
  border-radius: 3px;
}

.header {
  grid-column: 1 / -1;
  padding: 4px;
  display: flex;
  justify-content: space-between;
  font-size: 12px;

  background-image: linear-gradient(white, #ddd);
}

.manipulations,
.actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.manipulations > div,
.actions > div {
  padding: 4px;
}

.manipulations > div {
  margin-right: var(--control-gap);
}

.actions > div {
  margin-left: var(--control-gap);
}

.download-options {
  display: flex;
  margin-left: 12px;
  margin-right: 10px;
}

.download-options__title {
  margin-right: 8px;
  font-weight: 400;
}

.download-options__title::after {
  content: ":";
}

.download-options__option {
  min-width: 3em;
}

.details {
  overflow-y: auto;
}

.viewmode,
.sorting {
  display: flex;
  align-items: center;
}

.control.has-icons-left .icon {
  height: 1.8em;
  width: 1.8em;
  top: 50%;
  transform: translateY(-50%);
  margin-left: 0.15em;
}

.full {
  height: calc(100% - 50px);
}

.probe-viewer {
  overflow-x: hidden;
  overflow-y: auto;
}

.detail-viewer {
  margin: 0;
  margin-bottom: -10px;
  padding: 0;
  width: 400px;
  overflow-x: none;
  overflow-y: auto;
  border-left: 1px solid #aaa;
  background-color: #ccc;
  border-radius: 5px;
}

.buttons span {
  display: inline-flex;
  font-size: 0.75rem;
  height: 2.25em;
  vertical-align: top;
  border: 1px solid #dbdbdb;
  color: #363636;
  -webkit-box-pack: center;
  -ms-flex-pack: center;
  justify-content: center;
  padding: 0.375em 0.75em;
  text-align: center;
  white-space: nowrap;
}

.buttons label {
  display: inline-flex;
  font-size: 0.85rem;
  height: 2.25em;
  vertical-align: top;
  color: #363636;
  -webkit-box-pack: center;
  -ms-flex-pack: center;
  justify-content: center;
  padding: 0.375em 0.75em;
  font-weight: 500;
  text-align: center;
  white-space: nowrap;
}

.zoomDisplay {
  cursor: pointer;
  transition: 0.3s;
}
.zoomDisplay:hover {
  box-shadow: 0 0 1px 1px gold;
  background: lightgoldenrodyellow;
}

.fill-box {
  position: absolute;
  height: 27px;
  width: 25px;
}

.no-border {
  border: none;
  position: relative;
  display: flex;
}
</style>

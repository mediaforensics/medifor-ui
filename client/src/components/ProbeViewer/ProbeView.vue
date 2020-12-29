<template>
  <div id="probe-view-container">
    <!-- video player -->
    <div v-if="!parsedProbe.isImage">
      <VideoPlayer :probeInfo="parsedProbe" />
    </div>

    <div v-else class="default-container" ref="fullScreenView">
      <font-awesome-icon
        v-if="isFullScreen"
        icon="times"
        class="exit-button fa-lg"
        @click="exitFullscreen()"
      />

      <!--  ZoomHolderMask and ZoomHolderImage are indepedendent components
      ----- with seperate panzoom controllers connected to them. For panzoom to 
      ----- work correctly, panning and zooming events are passed between them
      ----- through the eventHub allowing them to pan and zoom in unison ---->

      <ZoomHolderMask
        v-if="maskUrl !== ''"
        :viewMode="viewMode"
        :url="rotatedMaskUrl"
        :colormap="colormap"
        :zoomToggle="zoomToggle"
        :zoomCoordinates.sync="zoomCoordinates"
        :panCoordinatesMask="panCoordinatesMask"
        v-on:update:panCoordinatesMask="panCoordinatesImg = $event"
      />

      <ZoomHolderImg
        :viewMode="viewMode"
        :url="rotatedImgUrl"
        :zoomToggle="zoomToggle"
        :zoomCoordinates.sync="zoomCoordinates"
        :panCoordinatesImg="panCoordinatesImg"
        v-on:update:panCoordinatesImg="panCoordinatesMask = $event"
      />
    </div>
  </div>
</template>

<script>
import { mapState, mapGetters } from "vuex";
import { probeParserMixin } from "@/mixins/probeParserMixin";
import { buildRequest } from "@/helpers/urlBuilder";
import * as axios from "axios";

/*eslint no-unused-vars: ["error", { "args": "none" }]*/
import VideoPlayer from "./VideoPlayer/VideoPlayer";
import ZoomHolderImg from "./ZoomHolderImg";
import ZoomHolderMask from "./ZoomHolderMask";

export default {
  name: "ProbeView",
  components: { VideoPlayer, ZoomHolderMask, ZoomHolderImg },
  mixins: [probeParserMixin],
  props: {
    rotateState: Number,
    viewMode: String,
    zoomToggle: Boolean,
    fullScreenToggle: Boolean
  },
  data: function() {
    return {
      rotatedImgUrl: null,
      rotatedMaskUrl: null,
      zoomCoordinates: { x: 0, y: 0 },
      panCoordinatesMask: { dx: 0, dy: 0 },
      panCoordinatesImg: { dx: 0, dy: 0 },
      isFullScreen: false
    };
  },
  watch: {
    /*
     * All watchers must check if the currently selected probe is an image
     * If currently selected analytic does not have a mask then no rotate requests for a mask will be made
     */
    maskUrl: function() {
      if (this.parsedProbe.isImage && this.maskUrl !== "") {
        this.rotateMask(this.maskImg, this.rotateState * 90);
        this.getRotationStates(this.maskImg);
      }
    },
    probe: function(current, previous) {
      if (current.id !== previous.id && this.parsedProbe.isImage) {
        this.rotateImg(this.probeImg, this.rotateState * 90);
        this.getRotationStates(this.probeImg);
      }
    },
    rotateState: function() {
      if (this.parsedProbe.isImage) {
        this.rotateImg(this.probeImg, this.rotateState * 90);
        if (this.maskUrl !== "")
          this.rotateMask(this.maskImg, this.rotateState * 90);
      }
    },
    /* The value doesn't matter, it is just a switch */
    fullScreenToggle: function() {
      this.enterFullscreen();
    }
  },
  computed: {
    ...mapState({
      probe: state => state.pipeline.probe,
      maskUrl: state => state.pipeline.maskUrl,
      colormap: state => state.layout.colormap
    }),
    ...mapGetters(["baseUri"]),
    /*
     * Raw file locations so server can locate them
     */
    probeImg: function() {
      const start = this.parsedProbe.source.indexOf("input/");
      return this.parsedProbe.source.substring(start);
    },
    maskImg: function() {
      const start = this.maskUrl.indexOf("output/");
      return this.maskUrl.substring(start);
    }
  },
  /* Rotate value 0-3 is proportional to a 90 degree rotation */
  methods: {
    rotateImg(path, rotateValue) {
      this.rotatedImgUrl = this.buildPath({ path, rotateValue });
    },
    rotateMask(path, rotateValue) {
      this.rotatedMaskUrl = this.buildPath({ path, rotateValue });
    },
    buildPath: function(queryParams) {
      const url = buildRequest(this.baseUri, "rotate", queryParams);
      return url;
    },
    /*
     * Get all the rotation states and cache them before loading them into view
     * This solves the delay between mask and img rotation
     */
    getRotationStates(path) {
      for (var i = 1; i <= 3; i++) {
        const rotateValue = i * 90;
        const url = this.buildPath({ path, rotateValue });
        axios.get(url);
      }
    },
    enterFullscreen() {
      if (this.$refs.fullScreenView.requestFullscreen) {
        this.$refs.fullScreenView.requestFullscreen();
      } else if (this.$refs.fullScreenView.webkitRequestFullScreen) {
        this.$refs.fullScreenView.webkitRequestFullScreen();
      } else if (this.$refs.fullScreenView.mozRequestFullScreen) {
        this.$refs.full.mozRequestFullScreen();
      } else if (this.$refs.fullScreenView.msRequestFullscreen) {
        this.$refs.fullScreenView.msRequestFullscreen();
      }
    },
    exitFullscreen() {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      } else if (document.mozCancelFullScreen) {
        document.mozCancelFullScreen();
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
      }
    }
  },
  mounted() {
    // Must rotate img on first load
    // Don't make request if probe is video
    if (this.parsedProbe.isImage) {
      this.rotateImg(this.probeImg, this.rotateState * 90);
      this.getRotationStates(this.probeImg);

      this.$refs.fullScreenView.addEventListener("fullscreenchange", () => {
        this.isFullScreen = !this.isFullScreen;
      });
    }
  }
};
</script>

<style scoped lang="scss">
#probe-view-container {
  height: 100%;
  width: 100%;
  overflow: hidden;
  background: #fff;
  padding-left: 2%;
  padding-right: 2%;
}

.default-container {
  position: relative;
  height: 100%;
  width: 100%;
}

.exit-button {
  position: relative;
  margin-top: 2%;
  left: 95%;
  color: white;
  opacity: 0.5;
}
</style>

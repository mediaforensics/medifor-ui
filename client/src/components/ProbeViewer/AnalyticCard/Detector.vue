<template>
  <section
    class="analytic_container"
    :class="{
      'analytic_container--highlight': friendlyData.id == 'groundtruth',
      'analytic_container--selected': isSelected,
      'analytic_container--fuser': isFuser
    }"
  >
    <div v-if="isFuser" class="analytic_card__pager">
      <button @click="previous" class="btn icon" :disabled="!usePager">
        <font-awesome-icon
          icon="caret-left"
          class="fas fa-lg has-text-grey-dark"
        />
      </button>
      <span class="has-text-black-ter">Fusion Model</span>
      <button @click="next" class="btn icon" :disabled="!usePager">
        <font-awesome-icon
          icon="caret-right"
          class="fas fa-lg has-text-grey-dark"
        />
      </button>
    </div>

    <section class="analytic_card" @click="selectDetector">
      <DetectorMask :maskData="maskData" />
      <div class="analytic_card__body">
        <DetectorHeader :headerData="headerData" />
        <div class="analytic_card__details">
          <Status
            :integrity="score"
            :manipulationFacets="manipulationFacets"
            :status="detectorStatus"
          />
          <SupplementalIndicator
            v-if="supplementalData"
            :probeId="probe.id"
            :analyticId="data.analytic_id"
          />
          <Expansion :expansionData="expansionData" />
        </div>
      </div>
    </section>
  </section>
</template>

<script>
import get from "lodash.get";
import isempty from "lodash.isempty";

import { mapMutations, mapState } from "vuex";

import { DetectionStage, DetectionStatus } from "../../constants/detection";

import DetectorHeader from "./DetectorHeader.vue";
import DetectorMask from "./DetectorMask.vue";
import Expansion from "./Expansion.vue";
import Status from "./Status.vue";
import SupplementalIndicator from "./SupplementalIndicator";

export default {
  name: "Detector",
  data: function() {
    return {
      base_uri: this.$store.getters.baseUri,
      currentFusionModel: String
    };
  },
  props: {
    data: {},
    detectionType: String,
    friendlyData: {},
    isFuser: Boolean,
    next: Function,
    previous: Function,
    usePager: Boolean
  },
  components: {
    //FrameTimeline,
    DetectorHeader,
    DetectorMask,
    Expansion,
    Status,
    SupplementalIndicator
  },
  methods: {
    ...mapMutations(["selectAnalytic"]),
    selectDetector() {
      //this.$store.commit("selectMask", "");
      if (this.selectedAnalytic === this.data.analytic_id) {
        this.selectAnalytic("");
        return;
      } else {
        this.selectAnalytic(this.data.analytic_id);
      }

      // show mask if available, otherwise say no mask
      if (this.hasMask) {
        this.$store.commit("selectMask", this.url);
        this.$store.commit("selectAnalytic", this.data.analytic_id);
      } else {
        this.$store.commit("selectMask", "");
        this.$store.commit("selectAnalytic", this.data.analytic_id);
      }
    }
  },

  computed: {
    ...mapState({
      probe: state => state.pipeline.probe,
      selectedAnalytic: state => state.pipeline.selectedAnalytic
    }),

    isFusionDetector: function() {
      return this.detectionType === "fuser";
    },
    //check if the current detector is a fusion detector or a standard analytic and return
    getDetector: function() {
      return this.isFusionDetector ? this.data.fusion : this.data.detection;
    },
    score: function() {
      const detector = this.getDetector;
      if (this.isImage) {
        return detector.img_manip.score;
      } else if (this.isVideo) {
        return detector.vid_manip.score;
      } else {
        return -1;
      }
    },
    //anything under 30% should return red
    iconFromScore: function() {
      if (this.score >= 0.7) return "minus-circle";
      else if (this.score <= 0.2) return "check-circle";
      else return "exclamation-circle";
    },
    classFromScore: function() {
      if (this.score >= 0.7) return "times";
      else if (this.score <= 0.2) return "check";
      else return "exclamation";
    },
    hasMask: function() {
      //has to check if current detector is fusion or regular analytic
      const detector = this.getDetector;
      const hasMask = !!(
        detector.img_manip &&
        detector.img_manip.localization &&
        detector.img_manip.localization.mask &&
        detector.img_manip.localization.mask.uri
      );
      return hasMask;
    },
    explanation: function() {
      const detector = this.getDetector;
      if (this.detectorStatus.failed) {
        return detector.status.message;
      } else {
        if (this.isImage) return detector.img_manip.explanation;
        else if (this.isVideo) return detector.vid_manip.explanation;
        return "Unsupported";
      }
    },
    url: function() {
      var url = this.$store.getters.baseUri;
      const detector = this.getDetector;
      if (this.isImage) {
        var filename = detector.img_manip.localization.mask.uri;
        var start = filename.indexOf("output/");
        filename = filename.substring(start);
        url += "/" + filename;
      } else if (this.isVideo) {
        console.log("Unimplemented");
      }
      return url;
    },
    getTime: function() {
      const detector = this.getDetector;
      var msTime =
        detector.end_time_millis.low - detector.start_time_millis.low;
      var min = Math.floor(msTime / 60000);
      var sec = Math.round((msTime % 60000) / 1000.0);
      //return min + "m " + sec + "s ";
      return (min == 0) & (sec == 0)
        ? `${msTime}ms`
        : min == 0
        ? sec + "s"
        : min + "m " + sec + "s";
    },
    isImage: function() {
      const detector = this.getDetector;
      return detector.img_manip !== undefined;
    },
    isVideo: function() {
      const detector = this.getDetector;
      return detector.vid_manip !== undefined;
    },
    isSelected: function() {
      return this.$store.getters.selectedAnalytic === this.data.analytic_id;
    },
    detectionStatus: function() {
      return this.data.status;
    },
    detectionStage: function() {
      return this.data.stage;
    },
    manipulationFacets: function() {
      const detector = this.getDetector;
      const target = detector.vid_manip || detector.img_manip;
      return isempty(target.facets) ? {} : target.facets;
    },
    detectionOptedOutScore: function() {
      const detector = this.getDetector;
      if (this.isImage) {
        const optOut = detector.img_manip.opt_out;
        return optOut == 1 || optOut == 2;
      } else if (this.isVideo) {
        return detector.vid_manip.opt_out.includes(0);
      }
      console.error("Unsupported: No image or video detected in analytic data");
      return false;
    },
    supplementalData: function() {
      const detector = this.getDetector;
      const target = detector.img_manip || detector.vid_manip;
      return target.supplement.length == 0 ? false : target.supplement;
    },

    /*
     * This checks all the possible stages/status that the analytic can be in
     * API only allows for the analytic to be in one of these stages at any given time
     * Checks object will return true for whatever stage/status it is in
     * This info is passed to Status Component and will display appropriate info
     */
    detectorStatus() {
      const checks = {
        completed: detector =>
          detector.detectionStage === DetectionStage.FINISHED,
        failed: detector =>
          detector.detectionStatus === DetectionStatus.FAILURE,
        optedOut: detector => detector.detectionOptedOutScore,
        queued: detector => detector.detectionStage === DetectionStage.QUEUED,
        running: detector => detector.detectionStage !== DetectionStage.FINISHED
      };
      // The first one to succeed is returned as the status. The order is significant.
      const statuses = [
        ["Failed", checks.failed],
        ["Queued", checks.queued],
        ["Opted Out", checks.optedOut],
        ["Complete", checks.completed],
        ["Running", checks.running]
      ];
      const status = statuses.find(([, test]) => test(this));
      return status
        ? { message: status[0], [status[1].name]: true }
        : { message: "Unkown detector status", unknown: true };
    },
    //helper for props to DetectorMask component
    maskData: function() {
      return {
        detectionType: this.detectionType,
        status: this.detectorStatus,
        data: this.isFusionDetector ? this.data.fusion : this.data.detection,
        isImage: this.isImage,
        hasMask: this.hasMask
      };
    },

    //helper for props to DetectorHeader component
    headerData: function() {
      return {
        status: this.detectorStatus,
        detectorName: this.friendlyData.name,
        iconFromScore: this.iconFromScore,
        classFromScore: this.classFromScore
      };
    },

    //helper for props to Expansion component
    expansionData: function() {
      return {
        explanation: this.explanation,
        mask: this.hasMask,
        time: this.getTime,
        isSelected: this.isSelected,
        status: this.detectorStatus,
        supplemental: this.supplementalData,
        analyticDescription: get(this, "friendlyData.description")
      };
    }
  },

  mounted() {
    this.currentFusionModel = this.$store.getters.fusionModel;
  }
};
</script>

<style scoped>
.analytic_container {
  margin: 4px 8px;
  border: solid 2px #bbb;
  border-radius: 3px;
  background: hsl(0, 0%, 92%);
  color: black;
}

.analytic_container--fuser,
.analytic_container--highlight {
  border-color: hsl(204, 86%, 53%);
}

.analytic_container--selected.analytic_card-highlight {
  background: hsl(203, 57%, 95%);
}

.analytic_card {
  box-sizing: border-box;
  display: flex;
}

.analytic_card__body {
  flex-grow: 1;
  margin-inline-start: 12px;
}

.analytic_card__details {
  color: #333;
  word-break: break-word;
}

.analytic_card__pager {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: hsla(204, 86%, 53%, 0.61);
  border-bottom: solid 1px hsla(0, 0%, 100%, 0.685);
}

/* Active card base */
.analytic_container {
}

.analytic_container > .analytic_card,
.analytic_container > .analytic_card__pager {
  padding: 8px;
}

.analytic_container > .analytic_card__pager {
  padding-top: 4px;
  padding-bottom: 4px;
}

/* Active card changes */
.analytic_container--selected {
  border-width: 4px;
  background: #fff;
}

.analytic_container--selected > .analytic_card,
.analytic_container--selected > .analytic_card__pager {
  padding: 6px;
}

.analytic_container--selected > .analytic_card__pager + .analytic_card {
  padding-top: 8px;
}

.analytic_container--selected > .analytic_card__pager {
  padding-top: 2px;
  padding-bottom: 4px;
}
</style>

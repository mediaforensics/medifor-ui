<template>
  <div class="vcontainer">
    <Tabs v-on:changeTab="changeTab" />

    <div class="tab-container" v-if="selectedTab == 'Detectors'">
      <Detector
        v-if="selectedFuser"
        :data="selectedFuser"
        :friendlyData="getFriendlyData(selectedFuser)"
        :detectionType="detectionHandler(selectedFuser)"
        :isFuser="true"
        :next="nextFuser"
        :previous="previousFuser"
        :usePager="usePager"
      />

      <!-- detectionType can only be 'fuser' if there is a currently selected fusion model and 
      it is the first element in the list, otherwise the first element is GroundTruth -->
      <Detector
        v-for="a in sortedDetectors"
        :key="a.analytic_id"
        :data="a"
        :friendlyData="getFriendlyData(a)"
        :detectionType="detectionHandler(a)"
      />
    </div>

    <Metadata v-else-if="selectedTab == 'Meta'" />
    <Labels v-else />
  </div>
</template>

<script>
import { mapState } from "vuex";

import Detector from "./AnalyticCard/Detector";
import Labels from "./Labels.vue";
import Metadata from "./Metadata.vue";
import Tabs from "./Tabs.vue";

export default {
  name: "DetailsView",
  components: {
    Detector,
    Labels,
    Metadata,
    Tabs
  },
  data: function() {
    return {
      selectedTab: "Detectors",
      currentFuserIndex: 0
    };
  },
  computed: {
    ...mapState({
      probe: state => state.pipeline.probe,
      fusionInfo: state => state.pipeline.probe.fusion_info,
      fusionModel: state => state.pipeline.fusionModel,
      analyticSortDir: state => state.layout.analyticSortDir,
      analyticSortField: state => state.layout.analyticSortField
    }),

    hasFused: function() {
      return this.probe.has_fused;
    },

    info: function() {
      return this.probe.analytic_info;
    },

    currentFusionModel: function() {
      return this.fusionModel !== "";
    },

    sortedDetectors: function() {
      if (this.probe.analytic_info === undefined) {
        //alert("no analytics");
        return [];
      }
      let sortList = this.probe.analytic_info.slice();
      let gtAnalytic = sortList.find(a => a.analytic_id == "groundtruth");
      sortList = sortList.filter(a => {
        return a.analytic_id !== "groundtruth";
      });
      //If length is 1 after removing GT reappend and return
      if (sortList.length == 1) {
        return gtAnalytic !== undefined
          ? sortList.unshift(gtAnalytic)
          : sortList;
      }

      let sortName = this.analyticSortField;
      let sortDir = this.analyticSortDir;

      function getUniversalScore(analytic) {
        if (analytic.detection.img_manip !== undefined)
          return analytic.detection.img_manip.score;
        else return analytic.detection.vid_manip.score;
      }

      sortList = sortList.sort((a, b) => {
        let analyticA = this.$store.getters.getFriendly(a.analytic_id);
        let analyticB = this.$store.getters.getFriendly(b.analytic_id);

        var aVal =
          sortName == "name"
            ? analyticA.name
            : sortName == "score"
            ? getUniversalScore(a)
            : Number(this.hasMask(a));
        var bVal =
          sortName == "name"
            ? analyticB.name
            : sortName == "score"
            ? getUniversalScore(b)
            : Number(this.hasMask(b));

        if (aVal < bVal || aVal === undefined) return -1 * sortDir;
        if (aVal > bVal || bVal === undefined) return 1 * sortDir;
        return 0;
      });

      if (sortName == "name") {
        if (gtAnalytic !== undefined) sortList.unshift(gtAnalytic);

        return sortList;
      } else if (sortName == "mask") {
        if (gtAnalytic !== undefined) sortList.unshift(gtAnalytic);

        return sortList;
      } else {
        let noScore = sortList.filter(a => {
          if (a.detection.img_manip !== undefined)
            return (
              a.detection.img_manip.opt_out == 1 ||
              a.detection.img_manip.opt_out == 2
            );
          else return a.detection.vid_manip.opt_out.includes(0);
        });
        let hasScore = sortList.filter(a => {
          if (a.detection.img_manip !== undefined)
            return (
              a.detection.img_manip.opt_out !== 1 &&
              a.detection.img_manip.opt_out !== 2
            );
          else return !a.detection.vid_manip.opt_out.includes(0);
        });
        if (sortName == "score") {
          if (gtAnalytic !== undefined) hasScore.unshift(gtAnalytic);
        }
        let finalSort = hasScore.concat(noScore);
        return finalSort;
      }
    },

    supplementalList: function() {
      var detectors = this.sortedDetectors;
      var hasSupplemental = [];
      var supplementalList = [];
      //iteratore over detectors and filter one with supplemental data
      detectors.forEach(element => {
        const type = element.detection || element.fusion;
        const target = type.img_manip || type.vid_manip;
        if (target.supplement.length !== 0) hasSupplemental.push(element);
      });
      //build array containg the analytics and all supplemental data for each
      hasSupplemental.forEach(element => {
        var detector = {};
        const name = this.getFriendlyData(element).name;
        const type = element.detection || element.fusion;
        const target = type.img_manip || type.vid_manip;
        const supplementalData = target.supplement;
        detector.name = name;
        detector.supplemental = [];
        supplementalData.forEach(item => {
          detector.supplemental.push(item);
        });
        supplementalList.push(detector);
      });
      return supplementalList;
    },

    selectedFuser() {
      if (this.probe.fusion_info.length === 0) return null;

      return this.currentFuserIndex < this.probe.fusion_info.length
        ? this.probe.fusion_info[this.currentFuserIndex]
        : this.probe.fusion_info[0];
    },

    usePager() {
      return this.fusionInfo.length > 1;
    }
  },

  watch: {
    fusionModel: {
      handler: "findFuserIndex",
      immediate: true
    }
  },

  methods: {
    nextFuser() {
      this.currentFuserIndex =
        this.currentFuserIndex === this.fusionInfo.length - 1
          ? 0
          : this.currentFuserIndex + 1;
    },

    previousFuser() {
      this.currentFuserIndex =
        this.currentFuserIndex === 0
          ? this.fusionInfo.length - 1
          : this.currentFuserIndex - 1;
    },

    findFuserIndex() {
      this.currentFuserIndex = this.currentFusionModel
        ? this.probe.fusion_info.findIndex(
            fuser => fuser.fuser_id == this.fusionModel
          )
        : false;
    },

    detectionHandler(detection) {
      return detection.detection ? "analytic" : "fuser";
    },

    changeTab(tabValue) {
      this.selectedTab = tabValue;
    },

    hasMask(analytic) {
      return analytic.detection.img_manip !== undefined
        ? analytic.detection.img_manip.localization !== null
        : analytic.detection.vid_manip.localization !== null;
    },

    sendMask(analytic) {
      if (this.hasMask(analytic)) {
        var url = analytic.detection.img_manip.localization.mask.uri.substring(
          16
        );
        this.$store.commit("selectMask", url);
      } else {
        this.$store.commit("selectMask", "");
      }
    },

    getFriendlyData(detection) {
      const id = detection.detection
        ? detection.analytic_id
        : detection.fuser_id;

      const result = this.$store.getters.getFriendly(id);

      return result;
    },

    startInterval() {
      this.intervalId = setInterval(() => {
        if (
          this.probe.analytics_finished == this.probe.analytics_total &&
          this.probe.analytics_total != 0
        )
          return;
        var payload = {};
        payload.probe = this.probe;
        payload.include_fused =
          this.probe.analytic_info[0].detection.img_manip !== null;
        this.$store.dispatch("selectProbe", payload);
      }, 10000);
    }
  },

  mounted() {
    this.startInterval();
  },

  beforeDestroy() {
    clearInterval(this.intervalId);
  }
};
</script>

<style scoped>
.vcontainer {
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  height: 100%;
}

.tab-container {
  flex: 1;
  overflow: auto;
}
</style>

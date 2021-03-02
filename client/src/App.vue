<template>
  <div id="app" @mouseup="stopMove($event)" @mousemove="drag($event)">
    <Navbar />
    <div class="columns is-mobile" id="app-content">
      <aside class="column is-narrow">
        <Sidebar />
      </aside>
      <ImportModal />
      <div
        class="column gallery-container"
        :class="{ 'is-narrow': probe !== null }"
        v-if="selectedMenu !== 'Upload'"
        ref="gallerycontainer"
        :style="galleryStyle"
      >
        <!-- Gallery Route -->
        <router-view name="gallery" />
      </div>
      <div
        @mousedown.prevent="startMove($event)"
        ref="slider"
        class="column is-narrow is-slider"
        v-if="selectedMenu !== 'Upload' && probe !== null"
      ></div>
      <!-- Probeview Route -->
      <div class="column" v-if="selectedMenu !== 'Upload' && probe !== null">
        <router-view name="probe" />
      </div>
      <!-- Upload Route -->
      <router-view class="column is-full-width" name="upload" />
    </div>
  </div>
</template>

<script>
import { mapActions, mapMutations, mapState, mapGetters } from "vuex";
import { FusionThresholdType } from "./components/constants/fusion";
import isEmpty from "lodash.isempty";
import Navbar from "./components/Navbar.vue";
import Sidebar from "./components/SideMenu/Sidebar.vue";
import ImportModal from "./components/Upload/ImportModal.vue";

export default {
  name: "App",
  data: function() {
    return {
      offsetX: 0,
      mouseX: 0,
      lastMousex: 0,
      isDragging: false,
      galleryWidth: "300px",
      loaded: false,
      fusionThresholdTypes: FusionThresholdType
    };
  },
  components: {
    Navbar,
    Sidebar,
    ImportModal
  },
  computed: {
    ...mapState({
      groups: state => state.user.groups,
      probe: state => state.pipeline.probe,
      probes: state => state.pipeline.probes,
      groupTag: state => state.config.groupTag,
      enableGroups: state => state.config.enableGroups,
      tagPrefixFlag: state => state.config.tagPrefixFlag,
      userTagPrefix: state => state.config.userTagPrefix,
      groupTagPrefix: state => state.config.groupTagPrefix,
      defaultFilterLabels: state => state.pipeline.defaultFilterLabels,
      allow: state => state.layout.allowGroupView
    }),
    ...mapGetters([
      "sortField",
      "sortDir",
      "fusionModel",
      "scoreDir",
      "scoreThreshold",
      "queryParameters",
      "selectedMenu"
    ]),
    galleryStyle: function() {
      return {
        width: this.galleryWidth,
        "max-width": this.$store.getters.probe !== null ? "40vw" : "100%"
      };
    }
  },
  methods: {
    ...mapActions([
      "loadUser",
      "loadConfig",
      "fetchAnalyticList",
      "fetchFacetInfo",
      "getProbes",
      "selectProbe",
      "setSort",
      "setPreferredGroup"
    ]),
    ...mapMutations([
      "setDefaultFilterLabels",
      "unselectAll",
      "applyFilters",
      "resetPageToken",
      "setFusionModel",
      "setScoreDir",
      "setScoreThreshold",
      "filterLabesl",
      "selectMenu",
      "setUserPreferences",
      "setAllowGroupView"
    ]),
    startMove(e) {
      this.lastMousex = e.pageX;
      this.isDragging = true;
    },
    stopMove() {
      this.isDragging = false;
    },
    drag(e) {
      if (!this.isDragging) return;
      this.mouseX = this.lastMousex - e.pageX;
      this.lastMousex = e.pageX;
      this.mouseX = this.$refs.gallerycontainer.clientWidth - this.mouseX;
      this.galleryWidth = this.mouseX + "px";
    },
    handleProbeRoute(id, fused) {
      this.selectProbe({ probe: { id: id }, includefused: fused });
    },
    /* This function handles setting the store values from the given URL
     * this update will be manually dispatched with 'getProbes()'  */
    handleGalleryQueryParams() {
      let {
        dir,
        tags,
        column,
        fuser_id,
        fusion_threshold_type,
        fusion_threshold_value
      } = this.$route.query;

      this.setFusionModel(fuser_id);
      this.setScoreDir(fusion_threshold_type);
      this.setSort({ direction: dir, field: column });
      this.setScoreThreshold(fusion_threshold_value * 100);

      if (tags) {
        let formattedTags = tags.includes(",") ? tags.split(",") : tags.split();

        /* Filter out the user group tag if user from given URL was looking at their uploaded media */
        const userGroupKey = `${this.tagPrefixFlag}${this.userTagPrefix}=`;

        formattedTags = formattedTags.filter(
          tag => !tag.includes(userGroupKey)
        );

        /* If user grouping is enabled and a user has been given a url from another user we need to set the group*/
        if (this.enableGroups && this.groupTagPrefix && this.tagPrefixFlag) {
          /* Extract group tag from url */
          const systemGroupKey = `${this.tagPrefixFlag}${this.groupTagPrefix}`;
          const fullGroupTag = formattedTags.find(tag =>
            tag.includes(systemGroupKey)
          );
          /* Check that the URL provided does have a group tag */
          if (fullGroupTag) {
            const [, groupValue] = fullGroupTag.split("=");

            /* Check if current user is member of that group
             * If they are member then change currently selected group to group from url
             * If they are not a member, set flag and render error message in gallery container*/
            if (this.groups.includes(groupValue)) {
              this.setPreferredGroup(groupValue);
              this.setAllowGroupView(true);
            } else {
              this.setAllowGroupView(false);
              this.$router.push({
                name: "gallery",
                query: {}
              });
            }

            /* Filter out the group tag when finished */
            formattedTags = formattedTags.filter(
              tag => !tag.includes(systemGroupKey)
            );
          }
        }
        /* Apply the user and system tags */
        this.applyFilters(formattedTags);
      }
    },

    /*  If user navigates to / then we must append default query params to render the gallery
     *  We don't need to worry about calling getProbes since the update will trigger the watcher
     *
     *  If the user provides a URL with query parameters we update the store then dispatch
     *
     *  If there are user preferences that were set but we have query parameters provided then
     *  preferences will be ignored on initial load*/
    async handleInitialGallery() {
      if (isEmpty(this.$route.query)) {
        this.$router.push({ path: "gallery", query: this.queryParameters });
      } else {
        this.handleGalleryQueryParams();
        await this.getProbes();
      }
    }
  },

  async created() {
    await this.loadConfig();
    await this.loadUser();
    try {
      await this.fetchAnalyticList();
    } catch (err) {
      console.error("Unable to get a list of analytics");
    }
    this.setDefaultFilterLabels();
    this.setUserPreferences();
    await this.handleInitialGallery();
    this.loaded = true;
  },
  mounted() {
    /* Get the facest list for multi-class fuser once */
    this.fetchFacetInfo();
  },
  /* All route watching is done at top level component */
  watch: {
    $route: {
      handler: function(current, previous) {
        // Unselect upload menu
        if (previous && previous.name == "upload") this.selectMenu("");

        // This handles updating the probe and closing the ProbeContainer
        if (this.$route.params.id) {
          this.handleProbeRoute(this.$route.params.id, 1);
        } else if (this.$store.getters.selectedMenu !== "Upload")
          this.unselectAll();
      },
      immediate: true
    },
    "$route.query": {
      handler: function(current, previous) {
        /* The reference to the query params will always change but not the values. Do a 'deep equals'
         * to know if we need to dispatch query */
        if (JSON.stringify(previous) !== JSON.stringify(current))
          this.getProbes();
      }
    }
  }
};
</script>

<style scoped>
#app {
  height: 100vh !important;
  background: hsl(210, 32%, 93%);
}

#app-content {
  height: calc(100vh - 3.25em) !important;
  min-height: calc(100vh - 3.25em);
  max-height: calc(100vh - 3.25em);
  margin: 0;
  padding: 0;
}
.column {
  height: 100%;
  overflow: auto;
  transition: 0s;
  padding: 6px;
}

.gallery-container {
  min-width: 250px;
  max-width: 40vw;
}

.column.is-one-third {
  transition: 0.35s;
}
.column:first-child {
  padding: 0px;
}

.is-slider {
  height: 98.5%;
  width: 6px;
  padding: 1px;
  margin-top: 6px;
  margin-bottom: 6px;
  border-radius: 3px;
  background-color: #7d7d7d;
  transition: 0.3s;
  cursor: col-resize;
}

.is-slider:hover {
  background-color: #a0a0a0;
}
</style>

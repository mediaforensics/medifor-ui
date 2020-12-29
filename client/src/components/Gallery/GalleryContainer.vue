<template>
  <div id="gallery-container" class="card" ref="gal">
    <div class="gallery-header level">
      <div class="level-left" v-if="!isLoading">
        <div class="level-item">
          <button v-if="hasGallery" @click="toggleView">
            <font-awesome-icon
              v-if="galleryMode === 'list'"
              icon="th"
              title="Toggle View"
            />
            <font-awesome-icon
              v-if="galleryMode === 'grid'"
              icon="list"
              title="Toggle View"
            />
          </button>
        </div>

        <div v-if="hasGallery" class="level-item selection">
          <div class="select is-small">
            <select @change="changeSort($event)" v-model="sortValue">
              <option value="File:UploadDate.desc">
                &darr; Date
              </option>
              <option value="File:UploadDate.asc">
                &uarr; Date
              </option>
              <option value="score.asc">
                &darr; Integrity
              </option>
              <option value="score.desc">
                &uarr; Integrity
              </option>
            </select>
          </div>
        </div>

        <div v-if="hasGallery" class="level-item">
          <span class="is-size-7">
            <a :href="galleryProbes" target="_blank" title="Download Gallery">
              Download ZIP
            </a></span
          >
        </div>
      </div>

      <div class="level-item">
        <Spinner v-if="isLoading" />
      </div>
    </div>
    <!-- end header -->

    <!-- gallery or table-->
    <div
      v-if="
        (hasGallery && groupingOnUserVerified) || (hasGallery && !enableGroups)
      "
      class="gallery"
    >
      <Gallery :galleryMode="galleryMode" />
    </div>
    <div v-else class="empty-gallery">
      <div>There are no probes to show.</div>
      <div v-if="externalCallError" class="errorMsg">
        An error has occurred with a service downstream, please contact your
        system administrator with this error:
        <div>
          <i>{{ externalCallError }}</i>
        </div>
      </div>
      <div v-if="groupingOnUserUnverified" class="errorMsg">
        User does not have access to provided group, user is unknown or groups
        are not defined. Please return to
        <a href="home">home page.</a>
      </div>
    </div>

    <!-- footer probe count -->
    <!-- Check that the 'galleryTotal' has computed before displaying it -->

    <!-- Display gallery if grouping is disabled or ig user has access to group when grouping is enabled -->
    <div
      v-if="
        (hasGallery && groupingOnUserVerified) ||
          (hasGallery && !enableGroups && typeof galleryTotal === 'number')
      "
      class="gallery-footer is-size-7"
    >
      <span class="label-font">Probes</span>
      <span class="has-text-right"> ({{ galleryTotal }})&nbsp;</span>
    </div>
  </div>
</template>

<script>
import { mapActions, mapState, mapGetters } from "vuex";
import { buildRequest } from "@/helpers/urlBuilder.js";
import { probeParserMixin } from "../../mixins/probeParserMixin";

import { setPreference } from "@/helpers/userPreferences";

import Gallery from "./Gallery.vue";
import Spinner from "./Spinner";
export default {
  name: "GalleryContainer",
  mixins: [probeParserMixin],
  components: {
    Gallery,
    Spinner
  },
  data: function() {
    return {
      galleryMode: "grid",
      sortValue: "File:UploadDate.desc"
    };
  },
  methods: {
    ...mapActions(["setSort"]),
    changeSort(event) {
      var [field, direction] = event.target.value.split(".");
      this.setSort({ field, direction });

      setPreference("column", field);
      setPreference("direction", direction);

      const { path: currentPath } = this.$route;
      this.$router.push({ path: currentPath, query: this.queryParameters });
    },
    toggleView() {
      this.galleryMode = this.galleryMode === "grid" ? "list" : "grid";
    },
    setGalleryTotal(total) {
      this.galleryTotal = total;
    }
  },
  computed: {
    ...mapState({
      username: state => state.user.name,
      groups: state => state.user.groups,
      sortDir: state => state.layout.sortDir,
      scoreDir: state => state.layout.scoreDir,
      sortField: state => state.layout.sortField,
      isLoading: state => state.pipeline.isLoading,
      enableGroups: state => state.config.enableGroups,
      fusionModel: state => state.pipeline.fusionModel,
      galleryTotal: state => state.pipeline.probeTotal,
      hasGallery: state => state.pipeline.probeTotal > 0,
      filterLabels: state => state.pipeline.filterLabels,
      downloadValue: state => state.pipeline.downloadValue,
      scoreThreshold: state => state.layout.scoreThreshold,
      allowGroupView: state => state.layout.allowGroupView,
      queryParameters: state => state.pipeline.queryParameters,
      externalCallError: state => state.pipeline.externalCallError
    }),
    ...mapGetters(["baseUri", "queryParameters"]),
    galleryProbes: function() {
      const url = this.CSVUrl;
      return url;
    },
    CSVUrl: function() {
      const BASE_URL = this.baseUri;
      const queryParameters = { ...this.queryParameters };
      queryParameters.csv = "yes";
      return buildRequest(BASE_URL, "probes", queryParameters);
    },
    home: function() {
      return window.location.origin;
    },
    /* All these condition must be met to show the gallery if grouping is enabled */
    groupingOnUserVerified: function() {
      return (
        this.enableGroups &&
        this.allowGroupView &&
        !!this.username &&
        this.groups.length > 0
      );
    },
    groupingOnUserUnverified: function() {
      return (
        (this.enableGroups && !this.allowGroupView) ||
        (this.enableGroups && !this.username) ||
        (this.enableGroups && this.groups.length == 0)
      );
    }
  },
  /* Need to listen for the mouse entering the gallery to be able to register the hover event for moving thumbnails */
  mounted() {
    this.$refs.gal.addEventListener("onmouseenter", () => {});

    const field = this.sortField;
    const dir = this.sortDir;
    const direction = dir == 1 ? "asc" : "desc";
    this.sortValue = `${field}.${direction}`;
  }
};
</script>

<style lang="scss" scoped>
button {
  margin-left: 2px;
  margin-top: 2px;
  padding: 6px 4px;
  border: none;
  border-radius: 3px;
  font-size: 1rem;
  color: #aaa;
  background-color: transparent;
  transition-duration: 0.4s;
}

button:hover {
  color: hsl(217, 71%, 53%);
  background-color: #eeeeee;
  cursor: pointer;
}

#gallery-container {
  position: relative;
  height: 100%;
  width: 100%;
  overflow-y: hidden;
  overflow-x: hidden;
  padding: 0;
  margin: 0;
  background-color: #ddd;
}

.gallery-header {
  background-color: white;
  // height: 40px;
  margin-bottom: 4px !important;
  padding: 4px 4px 0 4px;
  background-image: linear-gradient(white, #ddd);
}

.column {
  padding: 3px;
}

.label-font {
  font-weight: 500;
}

.gallery {
  width: calc(100% - 6px);
  height: calc(100% - 65px); // 86px
  max-height: calc(100% - 65px);
  margin: 3px;
  position: relative;
}

.gallery-footer {
  height: 25px;
  width: 100%;
  text-align: center;
  background-image: linear-gradient(to top, white, #d0d0d0);
}

#load-indicator {
  position: absolute;
  top: 40px;
  bottom: 0px;
  left: 0;
  right: 0;
  pointer-events: none;
  background: rgba(0, 0, 0, 0);
  z-index: 999999;
  transition: 0.5s;
}

.empty-gallery {
  text-align: center;
  padding-top: 20vh;
  font-size: 1.125rem;
  font-weight: 700;
}

.errorMsg {
  font-size: 0.9rem;
  width: 50%;
  text-align: center;
  margin: auto;
  color: #cc0033;
}
</style>

<template>
  <div class="viewer_holder">
    <div v-if="probeIsImage" class="media_holder">
      <p>Source Image</p>
      <img class="media" :src="imgUrl" />
    </div>
    <div v-else class="media_holder">
      <p>Source Video</p>
      <video class="media" :src="videoUrl" controls />
    </div>

    <div v-if="hasMask" class="media_holder">
      <p>Mask</p>
      <img class="media" :src="maskUrl" alt="" />
    </div>

    <div v-if="hasSupplemental" class="media_holder supplemental">
      <p>Supplemental</p>
      <img v-if="supplementalIsImage" class="media" :src="supplementalUrl" />
      <video
        v-else-if="supplementalIsVideo"
        class="media"
        :src="supplementalUrl"
        controls
      />
      <div v-else class="json_holder">
        <pre>{{ supplementalJSON }}</pre>
      </div>
    </div>
  </div>
</template>

<script>
import * as axios from "axios";
import JSONFormatter from "json-formatter-js";
import { getBaseUrl } from "@/helpers/urlBuilder";

export default {
  name: "SupplementalProbeViewer",
  data: function() {
    return {
      supplementalJSON: null
    };
  },
  /*current supplemental is passed in as the supplemental data URL */
  props: {
    analytic: Object,
    probe: Object,
    currentSupplemental: String
  },
  computed: {
    baseUrl: function() {
      return getBaseUrl();
    },
    hasMask: function() {
      const target = this.target;
      return target.localization;
    },
    target: function() {
      return (
        this.analytic.detection.img_manip || this.analytic.detection.vid_manip
      );
    },
    currentSupplementalData: function() {
      const target = this.target;
      const supplementalList = target.supplement;
      const supplementalId = this.currentSupplemental;
      return supplementalList.find(s => s.uri == supplementalId);
    },
    maskUrl: function() {
      const target = this.target;
      var rawUrl = target.localization.mask.uri;
      var baseUrl = this.baseUrl;
      var start = rawUrl.indexOf("output/");
      rawUrl = rawUrl.substring(start);
      baseUrl += "/" + rawUrl;
      return baseUrl;
    },
    hasSupplemental: function() {
      return this.currentSupplemental !== "";
    },
    supplementalUrl: function() {
      var rawUrl = this.currentSupplemental;
      var url = this.baseUrl + "/output/";
      var start = rawUrl.indexOf("output/") + 7;
      rawUrl = rawUrl.substring(start);
      url += encodeURIComponent(rawUrl);
      return url;
    },
    imgUrl: function() {
      var url = this.baseUrl + "/input/";
      var filename = this.analytic.detection.img_manip_req.image.uri;
      var start = filename.indexOf("input/") + 6;
      filename = filename.substring(start);
      url += encodeURIComponent(filename);
      return url;
    },
    videoUrl: function() {
      var url = this.baseUrl + "/input/transcoded/";
      var filename = this.analytic.detection.vid_manip_req.video.uri;
      var start = filename.indexOf("input/") + 6;
      filename = filename.substring(start);
      url += encodeURIComponent(filename);
      url = url.substring(0, url.lastIndexOf(".")) + ".mp4";
      return url;
    },
    supplementalIsImage() {
      const supplemental = this.currentSupplementalData;
      return supplemental.type.includes("image");
    },
    supplementalIsVideo() {
      const supplemental = this.currentSupplementalData;
      return supplemental.type.includes("video");
    },
    probeIsImage() {
      return this.probe.tags.type == "image";
    }
  },
  methods: {
    async JsonSupplementalData(supplementalData) {
      const { uri: filepath } = supplementalData;
      const start = filepath.indexOf("output/") + 7;
      const path = `./output/${filepath.substring(start)}`;

      const { href } = new URL(path, this.baseUrl);

      const response = await axios.get(href);
      this.supplementalJSON = new JSONFormatter(response.data);
    }
  },
  //Json hook is on mounted, currently an analytic will only produce one instance of Json data
  mounted() {
    this.JsonSupplementalData(this.currentSupplementalData);
  }
};
</script>

<style scoped>
.viewer_holder {
  display: flex;
  flex-wrap: wrap;
}

.media_holder {
  position: relative;
  box-shadow: 0 2px 6px 2px #888888;
  flex: 1 1 200px;
  margin: 12px;
  max-width: 650px;
  border-radius: 4px;
  background-color: slategrey;
}

.media_holder p {
  position: absolute;
  left: 0;
  right: 0;
  color: hsla(0, 0%, 100%, 1);
  text-shadow: 2px 2px 1px #333;
  background: hsla(0, 0%, 0%, 0.5);
  font-size: 0.9rem;
  font-weight: 500;
  border-start-start-radius: 4px;
  border-start-end-radius: 4px;
  padding-inline: 0.6em;
  padding-block: 0.2em;
}

.media {
  border-radius: 4px;
  object-fit: contain;
  width: 100%;
}

div.json_holder {
  border: solid 1px #888;
  margin-block-start: 36px;
  margin-block-end: 12px;
  margin-inline: 12px;
  overflow: auto;
}
</style>

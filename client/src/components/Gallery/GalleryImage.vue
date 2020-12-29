<template>
  <div class="gallery-image" :style="imageStyle" @click="selectCurrentProbe">
    <span v-if="imageReady || videoReady" class="container" ref="contentHolder">
      <router-link
        :to="{
          name: 'probe',
          params: { id: parsedProbe.id },
          query: this.queryParameters
        }"
      >
        <img
          v-if="parsedProbe.isImage"
          :alt="altText"
          :src="parsedProbe.thumbnail"
        />
        <video
          v-else
          ref="videoHolder"
          @mouseenter="playVideo()"
          @mouseleave="pauseVideo()"
          :src="parsedProbe.thumbnail"
          :poster="thumb"
          muted="true"
        />
        <span
          class="has-background-light bottom-left"
          v-if="parsedProbe.hasFused"
        >
          {{ parsedProbe.galleryFusedScore }}&nbsp;
        </span>
        <span class="progressBar">
          <span class="progressFill" :style="computeProgress"></span>
        </span>
      </router-link>
    </span>

    <span v-else class="loading-container">
      <Spinner />
    </span>

    <font-awesome-icon
      v-if="parsedProbe.isVideo"
      icon="play-circle"
      class="overlay-icon"
      ref="playButton"
    />
  </div>
</template>

<script>
/* parsedProbe is object returned from probeParser Mixin
it contains a variety of data on the currently selected probe */
import { mapActions, mapState, mapGetters } from "vuex";
import { probeParserMixin } from "../../mixins/probeParserMixin";
import Spinner from "./Spinner";

export default {
  name: "GalleryImage",
  components: {
    Spinner
  },
  mixins: [probeParserMixin],
  data: function() {
    return {
      isClicked: false,
      imageReady: false,
      videoReady: false,
      thumbnail: null,
      hasVideo: false,
      showPlay: true
    };
  },
  props: {
    gridHeight: Number,
    probe: {}
  },
  methods: {
    ...mapActions(["selectProbe"]),

    selectCurrentProbe() {
      var payload = {};
      payload.probe = this.probe;
      this.selectProbe(payload);
    },
    // https://developers.google.com/web/updates/2017/06/play-request-was-interrupted
    playVideo() {
      this.$refs.playButton.style.display = "none";
      const videoPromise = this.$refs.videoHolder.play();
      videoPromise
        .then(() => {})
        .catch(error => {
          console.log(error);
        });
    },
    // https://developers.google.com/web/updates/2017/06/play-request-was-interrupted
    pauseVideo() {
      this.$refs.playButton.style.display = "block";
      const videoPromise = this.$refs.videoHolder.play();
      if (videoPromise !== undefined) {
        videoPromise
          .then(() => {
            this.$refs.videoHolder.pause();
          })
          .catch(error => {
            console.log(error);
          });
      }
    }
  },
  computed: {
    ...mapState({
      stateProbe: state => state.pipeline.probe
    }),
    ...mapGetters(["queryParameters"]),
    altText: function() {
      return `Link to probe with ID: ${this.parsedProbe.id}`;
    },
    computeProgress: function() {
      let ratio = this.probe.analytics_finished / this.probe.analytics_total;
      return {
        background: "hsl(208 , 95%, 75%)",
        width: ratio * 100 + "%"
      };
    },
    isSelected: function() {
      return this.stateProbe !== null && this.stateProbe.id === this.probe.id;
    },
    imageStyle: function() {
      return {
        height: this.gridHeight + "px",
        opacity: this.isSelected ? ".25" : "1"
      };
    },
    thumb: function() {
      return this.parsedProbe.thumbnail.replace(".mp4", ".jpg");
    }
  },

  mounted() {
    /* Temporary hack to get this working */
    if (this.parsedProbe.isImage) {
      const img = new Image(100, 100);
      img.addEventListener("load", () => {
        this.imageReady = true;
      });
      img.src = this.parsedProbe.thumbnail;
    } else {
      setTimeout(() => {
        this.videoReady = true;
      }, 750);
    }
  }
};
</script>

<style scoped lang="scss">
.gallery-image {
  position: relative;
  flex: 1 1 auto;
  padding: 4px;
  cursor: pointer;
  margin: 1px 1px;
  box-sizing: border-box;
  border-radius: 4px;
}

.gallery-image:hover {
  box-shadow: 0 2px 6px 2px #888888;
  transition: 0.3s;
}
img {
  height: 100%;
  object-fit: cover;
  max-width: 100%;
  min-width: 100%;
  vertical-align: bottom;
}

video {
  height: 100%;
  object-fit: initial;
  max-width: 100%;
  min-width: 100%;
  vertical-align: bottom;
}

.loading-container {
  display: inline-flex;
  justify-content: center;
  align-items: center;
  border: solid 4px hsla(210, 13%, 50%, 0.7);
  background: hsla(210, 13%, 50%, 0.3);
  width: 134px;
  height: 134px;
  border-radius: 3px;
}

.overlay-icon {
  position: absolute;
  color: white;
  top: 50%;
  left: 50%;
  font-size: 4em;
  text-align: center;
  transform: translate(-50%, -50%);
  opacity: 0.5;
}

.container {
  position: relative;
  text-align: center;
  color: white;
}

.bottom-left {
  position: absolute;
  bottom: 0px;
  display: block;
  color: #333;
  padding: 2px 3px;
  font-size: 0.7em;
  font-weight: 600;
  border-radius: 0 6px 0 0;
  transition: 0.3s;
}

.progressBar {
  position: absolute;
  left: 0;
  right: 0;
  bottom: -4px;
  height: 4px;
  background: #333;
  z-index: 1;
  transition: 0.3s;
}
.progressFill {
  position: absolute;
  left: 0;
  height: 4px;
  transition: 0.3s;
}
</style>

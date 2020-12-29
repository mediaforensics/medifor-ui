<template>
  <!-- outer holder -->
  <div class="video-holder" ref="videoHolder">
    <!-- Video stage (container for transforms) -->
    <div
      id="video-container"
      ref="stage"
      class="stage"
      :class="{ 'stage-full': isFullScreen, 'stage-normal': !isFullScreen }"
    >
      <div class="actions">
        <button
          class="button is-small is-white is-outlined"
          @click="resetPanZoom"
        >
          Reset
        </button>
      </div>

      <!-- loading spinner -->
      <div class="video-spinner" v-if="showSpinner">
        <div class="video-spinner-inner">
          <font-awesome-icon icon="spinner" class="fa-spin" />
        </div>
      </div>

      <!-- actual video player -->
      <video
        class="video-player"
        ref="videoPlayer"
        :muted="isMuted"
        :src="probeInfo.source"
        @timeupdate="timeUpdate"
        @progress="calculateBufferRanges()"
        @waiting="unhideSpinner()"
        @canplay="hideSpinner()"
        @ended="onVideoEnded()"
      >
        <p>Your Browser Doesn't support HTML5 Video</p>
      </video>
    </div>

    <!-- video controls -->
    <div
      class="video-controls has-background-white-ter"
      :class="{
        fixed: $store.getters.selectedAnalytic !== ''
      }"
    >
      <div class="has-text-centered">
        <!-- Play Button -->
        <button class="button" v-if="!videoPlaying" @click="togglePlayPause">
          <font-awesome-icon icon="play-circle" />
        </button>

        <button class="button" v-else @click="togglePlayPause">
          <font-awesome-icon icon="pause-circle" />
        </button>
      </div>

      <!-- Audio mute -->
      <div class="has-text-centered">
        <button class="button" v-if="isMuted" @click="isMuted = !isMuted">
          <font-awesome-icon icon="volume-mute" />
        </button>
        <button class="button" v-if="!isMuted" @click="isMuted = !isMuted">
          <font-awesome-icon icon="volume-up" />
        </button>
      </div>

      <div>
        <!-- Scrubber Bar -->
        <div
          ref="progressbar"
          class="controls-progress"
          @click="skipToPosition($event)"
          @mousemove="showHoverTime($event)"
        >
          <div class="controls-progress-time" v-if="timeElapsed">
            {{ timeElapsed }}
          </div>
          <span
            class="controls-progress-back"
            :class="{ started: percentPlayed !== 0 }"
            :style="{ width: percentPlayed }"
          ></span>
          <div class="controls-progress-ranges">
            <span
              class="controls-progress-range"
              v-for="range in bufferRanges"
              :key="range.start"
              :style="{ width: range.end }"
            ></span>
          </div>
        </div>

        <!-- Manipulated Range Markers -->
        <div v-if="getRanges.length > 0" class="controls-progress-markers">
          <FrameTimeline :frameData="getRanges" :useColorMap="true" />
        </div>
      </div>

      <!-- Time Remaining -->
      <div class="controls-time">{{ timeRem }}</div>

      <!-- Playback Settings -->
      <PlaybackSpeedController v-on:updatePlaybackSpeed="setPlaybackRate" />

      <!-- Fullscreen -->
      <div>
        <button v-if="!isFullScreen" class="button" @click="enterFullscreen">
          <font-awesome-icon icon="expand" />
        </button>
        <button v-if="isFullScreen" class="button" @click="exitFullscreen">
          <font-awesome-icon icon="compress" />
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import panzoom from "panzoom";
import FrameTimeline from "../../common/FrameTimeline";
import PlaybackSpeedController from "./PlaybackSpeedController";

export default {
  name: "VideoPlayer",

  components: {
    FrameTimeline,
    PlaybackSpeedController
  },

  props: { probeInfo: Object },

  data: function() {
    return {
      bufferRanges: [],
      isMounted: false,
      isMuted: false,
      panZoomHandler: null,
      percentPlayed: "0",
      ranges: [],
      showSpinner: false,
      timeElapsed: null,
      timeRem: "00:00",
      totalFrames: 0,
      videoPlaying: false,
      isFullScreen: false
    };
  },

  computed: {
    getRanges: function() {
      var o = [];
      var analytic = {};
      for (const a of this.$store.getters.probe.analytic_info) {
        if (a.analytic_id === this.$store.getters.selectedAnalytic) {
          analytic = a;
          break;
        }
      }
      // break analytic into the localization ranges
      if (
        analytic.detection == undefined ||
        analytic.detection.vid_manip.localization === null
      )
        return {};
      for (const range of analytic.detection.vid_manip.localization
        .frame_detection) {
        o.push(range);
      }

      return o;
    }
  },
  watch: {
    probeInfo: function(current, previous) {
      if (current.source !== previous.source) {
        this.resetPanZoom();
        return;
      }
    }
  },

  mounted() {
    this.isMounted = true;
    let self = this;
    self.$nextTick(function() {
      "";
      self.resetPanZoom();
    });

    //This adds an event listener for when fullscreen is toggled with ESC key or button
    self.$refs.videoHolder.addEventListener("fullscreenchange", () => {
      self.isFullScreen = !self.isFullScreen;
    });
  },

  updated() {
    this.videoPlaying = !this.$refs.videoPlayer.paused;
  },

  methods: {
    resetPanZoom() {
      this.panZoomHandler = panzoom(this.$refs.videoPlayer, {
        maxZoom: 4,
        minZoom: 1,
        smoothScroll: false
      });
      this.panZoomHandler.zoomAbs(0, 0, 1);
    },

    getFramesToPercent(frame) {
      if (this.$store.getters.meta == null) return "0%";
      this.totalFrames = this.$store.getters.meta["File:Frames"];
      return (frame / this.totalFrames) * 100 + "%";
    },
    computeMarkerStyle(start, end, score) {
      return {
        left: this.getFramesToPercent(start),
        width: this.getFramesToPercent(end - start),
        top: (1 - score) * 20 + "px"
      };
    },

    secondsToHumanReadable(num) {
      let hours = Math.floor(num / 3600);
      let minutes = Math.floor((num % 3600) / 60);
      let seconds = num % 60;
      // Add leading zero if needed
      hours = hours < 10 ? "0" + hours : hours;
      minutes = minutes < 10 ? "0" + minutes : minutes;
      seconds = (seconds < 10 ? "0" + seconds : seconds).toString();
      if (seconds.length > 4) seconds = seconds.substring(0, 5);
      // If hours > 0, return string with hours prepended
      if (hours > 0) {
        return hours + ":" + minutes + ":" + seconds;
      }
      return minutes + ":" + seconds;
    },

    percentageOffset(e) {
      return e.offsetX / this.$refs.progressbar.offsetWidth;
    },
    setPlaybackRate(speed) {
      this.$refs.videoPlayer.playbackRate = speed;
    },

    currentTime(percentage) {
      return (
        Math.floor(percentage * this.$refs.videoPlayer.duration * 100) / 100
      );
    },

    showHoverTime(e) {
      var percentageOffset = this.percentageOffset(e);
      var timeInSeconds = this.currentTime(percentageOffset);

      if (!isNaN(timeInSeconds))
        this.timeElapsed = this.secondsToHumanReadable(timeInSeconds);
    },

    calculateBufferRanges() {
      this.bufferRanges = [];

      // loop through ranges
      for (let i = 0, l = this.$refs.videoPlayer.buffered.length; i < l; i++) {
        const totalDuration = this.$refs.videoPlayer.duration;
        const startTime = Math.floor(
          (100 / totalDuration) * this.$refs.videoPlayer.buffered.start(i)
        );
        const endTime = Math.floor(
          (100 / totalDuration) * this.$refs.videoPlayer.buffered.end(i)
        );
        this.bufferRanges.push({ start: startTime + "%", end: endTime + "%" });
      }
    },

    togglePlayPause() {
      if (this.showSpinner) return false;
      this.videoPlaying ? this.pauseVideo() : this.playVideo();
    },

    pauseVideo() {
      this.$refs.videoPlayer.pause();
      this.videoPlaying = false;
    },

    playVideo() {
      this.$refs.videoPlayer.play();
      this.videoPlaying = true;
    },

    skipToPosition(e) {
      const percentageOffset = this.percentageOffset(e);
      this.$refs.videoPlayer.currentTime = this.currentTime(percentageOffset);
    },

    enterFullscreen() {
      if (this.$refs.videoHolder.requestFullscreen) {
        this.$refs.videoHolder.requestFullscreen();
      } else if (this.$refs.videoHolder.webkitRequestFullScreen) {
        this.$refs.videoHolder.webkitRequestFullScreen();
      } else if (this.$refs.videoHolder.mozRequestFullScreen) {
        this.$refs.videoHolder.mozRequestFullScreen();
      } else if (this.$refs.videoHolder.msRequestFullscreen) {
        this.$refs.videoHolder.msRequestFullscreen();
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
    },

    percentagePlayed() {
      //trick vue into waiting for mounted
      if (!this.isMounted) return "0%";
      if (
        this.$refs.videoPlayer == undefined ||
        this.$refs.videoPlayer.readyState < 2
      )
        return "0%";
      return (
        Math.floor(
          (100 / this.$refs.videoPlayer.duration) *
            this.$refs.videoPlayer.currentTime
        ) + "%"
      );
    },

    remainingTime() {
      //trick vue into waiting for mounted
      if (!this.isMounted) return 0;
      if (
        this.$refs.videoPlayer == undefined ||
        this.$refs.videoPlayer.readyState < 2
      )
        return 0;
      return Math.round(
        this.$refs.videoPlayer.duration - this.$refs.videoPlayer.currentTime
      );
    },

    timeRemaining() {
      return this.secondsToHumanReadable(this.remainingTime());
    },

    timeUpdate() {
      this.timeRem = this.timeRemaining();
      this.percentPlayed = this.percentagePlayed();
    },

    unhideSpinner() {
      this.showSpinner = true;
    },

    hideSpinner() {
      this.showSpinner = false;
    },

    onVideoEnded() {
      this.$refs.videoPlayer.pause();
    }
  }
};
</script>

<style lang="scss" scoped>
.stage,
.video-controls {
  max-width: 100vw;
  margin: 0 auto;
}

.stage {
  margin-top: 12px;
  position: relative;
  overflow: hidden;
  background: #606c88;
  background: radial-gradient(
    ellipse at center,
    hsl(0, 0%, 25%) 0%,
    hsl(0, 0%, 5%) 100%
  );
  border: solid 1px #606c88;
}

.stage-full {
  height: 94%;
  max-height: 95vh;
}

.stage-normal {
  max-height: 70vh;
}

.video-controls {
  border: solid 1px silver;
  border-top: none;
  padding: 3px;
  display: grid;
  grid-row-gap: 10px;
  grid-column-gap: 10px;
  align-items: center;
  grid-template-columns: repeat(2, auto) 20fr repeat(3, auto);
}

.video-controls > div {
  margin: 0;
  padding: 0;
}

video {
  top: 0;
  left: 0;
  max-width: 100%;
  width: 100%;
  min-height: 50vh;
  max-height: 95vh;
}

#video-container {
  position: relative;
}

.actions {
  position: absolute;
  right: 10px;
  top: 10px;
  z-index: 1000;
}

.video-spinner {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 99;
}
.video-spinner-inner {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  color: white;
  font-size: 50px;
}

.controls-button {
  flex: 0 0 60px;
  display: block;
  position: relative;
  height: 40px;
  margin-right: 14px;
  text-align: center;
  background-color: rgba(0, 0, 0, 0.7);
  border-radius: 8px;
  border: 1px solid #777;
}

.controls-button:focus {
  outline: none;
}

.controls-button:before,
.controls-button:after {
  content: "";
  position: absolute;
}

.controls-button.play:before {
  left: 50%;
  top: 50%;
  margin: -10px 0 0 -6px;
  width: 0;
  height: 0;
  border-top: 10px solid transparent;
  border-bottom: 10px solid transparent;
  border-left: 18px solid white;
}

.controls-button.pause:before,
.controls-button.pause:after {
  height: 22px;
  width: 6px;
  background-color: white;
  top: 9px;
}

.controls-button.pause:before {
  left: 20px;
}

.controls-button.pause:after {
  left: 34px;
}
.controls-bar {
  display: flex;
  flex-grow: 1;
  align-items: center;
  background-color: rgba(0, 0, 0, 0.7);
  border-radius: 8px;
  height: 34px;
}
.controls-progress {
  flex: 1;
  margin: 0;
  width: 100%;
  height: 6px;

  border-radius: 3px;

  background-color: black;
  position: relative;
}

.controls-progress:hover {
  cursor: pointer;
}
.controls-progress:hover .controls-progress-time {
  display: block;
}
.controls-progress-time {
  display: none;
  position: absolute;
  top: -40px;
  left: 50%;
  background-color: rgba(0, 0, 0, 0.7);
  color: #fff;
  padding: 4px 12px;
  border-top-left-radius: 5px;
  border-top-right-radius: 5px;
}
.controls-progress-back {
  position: absolute;
  height: 6px;
  top: 0;
  left: 0;
  width: 0;
  background-color: #33ccff;
  border-radius: 3px;
  z-index: 9999;
}
.controls-progress-ranges {
  position: absolute;
  height: 6px;
  top: 0;
  left: 0;
  right: 0;
  background-color: #000;
  border: 1px solid #333;
  border-radius: 3px;
  overflow: hidden;
  z-index: 999;
}
.controls-progress-range {
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  width: 0;
  border-radius: 3px;
  background-color: grey;
  z-index: 500;
}

.controls-progress-markers {
  margin-top: 6px;
  height: 20px;
}

.controls-time {
  font-variant-numeric: tabular-nums;
}

.controls-fullscreen {
  width: 20px;
  height: 16px;
  position: relative;
  transition: transform 0.2s ease;
  margin-right: 12px;
}
.controls-fullscreen:hover {
  transform: scale(1.05);
  cursor: pointer;
}
.controls-fullscreen span {
  position: absolute;
  width: 5px;
  height: 5px;
  display: block;
}
.controls-fullscreen span:first-child {
  top: 0;
  left: 0;
  border-left: 2px solid white;
  border-top: 2px solid white;
}
.controls-fullscreen span:nth-child(2) {
  top: 0;
  right: 0;
  border-top: 2px solid white;
  border-right: 2px solid white;
}
.controls-fullscreen span:nth-child(3) {
  bottom: 0;
  left: 0;
  border-left: 2px solid white;
  border-bottom: 2px solid white;
}
.controls-fullscreen span:last-child {
  bottom: 0;
  right: 0;
  border-bottom: 2px solid white;
  border-right: 2px solid white;
}

// --------------
/* Slider */
$track-color: darkgray;
$track-height: 8px;
</style>

<template>
  <div class="container" :style="computeBg()">
    <div
      class="marker"
      v-for="frame in frameData"
      :key="frame.range.start"
      :style="computeStyle(frame.range.start, frame.range.end, frame.score)"
    ></div>
  </div>
</template>

<script>
import * as cGradient from "../../helpers/colorGradients";
export default {
  name: "FrameTimeline",
  props: {
    frameData: Array,
    useColorMap: Boolean
  },
  methods: {
    computeBg() {
      if (this.useColorMap) {
        let col = cGradient.interpolateGradient(
          this.$store.getters.colormap,
          1
        );
        return {
          background: `rgba(${col[0]}, ${col[1]}, ${col[2]}, 255)`
        };
      }
    },
    computeStyle(start, end, score) {
      let style = {
        left: (start / this.lastFrame) * 100 + "%",
        width: ((end - start) / this.lastFrame) * 100 + "%"
      };
      if (this.useColorMap) {
        let col = cGradient.interpolateGradient(
          this.$store.getters.colormap,
          1 - score
        );
        style["background"] = `rgba(${col[0]}, ${col[1]}, ${col[2]}, 255)`;
      }
      return style;
    }
  },
  computed: {
    lastFrame: function() {
      return this.$store.getters.meta["File:Frames"];
    }
  }
};
</script>

<style scoped>
.container {
  position: relative;
  width: 100%;
  height: 100%;
  background: #333;
  max-width: 100%;
}
.marker {
  position: absolute;
  background: white;
  height: 100%;
  width: 3px;
}
</style>

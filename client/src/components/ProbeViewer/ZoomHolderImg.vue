<template>
  <div
    class="default"
    ref="holder"
    :class="{
      normal: isNormal,
      vertical: isVertical,
      horizontal: isHorizontal,
      overlay: isOverlay
    }"
  >
    <img
      :src="url"
      alt=""
      ref="zoomContainer"
      @mousedown.prevent="startDrag()"
      @mouseup="stopDrag()"
      @mousemove.prevent="drag()"
    />
    <span>{{ zoomCoordinates.x }}</span>
  </div>
</template>

<script>
import { mapGetters, mapMutations, mapState } from "vuex";

import panzoom from "panzoom";
export default {
  name: "ZoomHolder",
  data: function() {
    return {
      panZoomHandler: null,
      isDragging: false,
      mouseX: 0,
      mouseY: 0,
      zoom: 100
    };
  },
  props: {
    viewMode: String,
    url: String,
    zoomToggle: Boolean,
    zoomCoordinates: Object,
    panCoordinatesImg: Object
  },
  watch: {
    viewMode: function() {
      this.panZoomHandler.zoomAbs(0, 0, 1);
    },
    probe: function(current, previous) {
      if (current.id != previous.id) {
        this.resetZoomState();
        this.panZoomHandler.zoomAbs(0, 0, 1);
      }
    },
    /*
     * Zoom by 50 increment when toggle buttons are hit
     */
    zoomToggle: function() {
      this.panZoomHandler.zoomAbs(
        this.mouseX,
        this.mouseY,
        this.zoomState / 100
      );
    },
    /*
     * Zoom to location when new coordinates are passed down
     */
    zoomCoordinates: function(coordinates) {
      const { x, y } = coordinates;
      if (this.zoomState !== 100) {
        this.panZoomHandler.zoomAbs(x, y, this.zoomState / 100);
        this.mouseX = x;
        this.mouseY = y;
      }
    },
    /*
     * Pan to location when new coordinates are passed down
     */
    panCoordinatesImg: function(coordinates) {
      const { dx, dy } = coordinates;
      this.panZoomHandler.moveBy(dx, dy);
    }
  },
  computed: {
    ...mapState({
      zoomState: state => state.layout.zoomState,
      probe: state => state.pipeline.probe
    }),
    ...mapGetters(["maskUrl", "baseUri"]),
    isNormal: function() {
      return this.maskUrl == "";
    },
    isVertical: function() {
      return this.viewMode == "vertical";
    },
    isHorizontal: function() {
      return this.viewMode == "horizontal";
    },
    isOverlay: function() {
      return this.viewMode == "overlay" && this.maskUrl !== "";
    }
  },
  methods: {
    ...mapMutations(["calculateZoomState", "resetZoomState"]),
    startDrag() {
      this.isDragging = true;
    },
    drag() {
      if (!this.isDragging) return;
    },
    stopDrag() {
      this.isDragging = false;
    }
  },
  mounted() {
    /*
     * 'beforeWheel' registers the position of the mouse on wheel event
     * Pass the pan coordinates to ProbeView
     * Both images will zoom to same position
     *
     *  return true turns off the wheel event and allows us to handle it ourselves
     */
    this.panZoomHandler = panzoom(this.$refs.zoomContainer, {
      minZoom: 1,
      maxZoom: 5,
      bounds: true,
      boundsPadding: 1,
      zoomSpeed: 0.00001,
      zoomDoubleClickSpeed: 1,

      beforeWheel: e => {
        this.calculateZoomState(e);
        this.$emit("update:zoomCoordinates", { x: e.offsetX, y: e.offsetY });
        return true;
      }
    });
    /*
     * When the mouse is dragging emit the coordinates to ProbeView
     */
    this.panZoomHandler.on("pan", e => {
      const mouseDelta = e.getMouseMovement();
      if (this.isDragging) {
        this.$emit("update:panCoordinatesImg", {
          dx: mouseDelta.dx,
          dy: mouseDelta.dy
        });
      }
    });
  }
};
</script>

<style scoped>
.default {
  overflow: hidden;
}

.normal {
  position: relative;
  top: 15%;
  margin: auto;
  height: 70%;
  width: 80%;
}

.vertical {
  display: block;
  position: relative;
  height: 45%;
  width: 75%;
  top: 5%;
  margin: auto;
}

.horizontal {
  display: inline-block;
  position: relative;
  width: 45%;
  height: 50%;
  margin: auto;
  left: 5%;
  top: 20%;
}

.overlay {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  height: 70%;
  width: 80%;
}

img {
  position: relative;
  object-fit: contain;
  width: 100%;
  height: 100%;
}

.hidden {
  display: none;
  visibility: hidden;
}
</style>

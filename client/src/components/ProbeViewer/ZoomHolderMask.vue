<template>
  <div
    class="default normal"
    ref="holder"
    :class="{
      vertical: isVertical,
      horizontal: isHorizontal,
      overlay: isOverlay
    }"
    :style="opacity"
  >
    <img
      :src="url"
      alt=""
      ref="zoomContainer"
      :class="{ maskStyle }"
      @mousedown.prevent="startDrag()"
      @mouseup="stopDrag()"
      @mousemove.prevent="drag()"
    />

    <!-- Hidden image and canvas for preloading and coloring -->
    <img ref="hiddenImg" crossorigin="" class="hidden" />
    <canvas ref="canvas" class="hidden"></canvas>
  </div>
</template>

<script>
import { mapGetters, mapState, mapMutations } from "vuex";
import * as cGradients from "../../helpers/colorGradients";
import panzoom from "panzoom";
export default {
  name: "ZoomHolder",
  data: function() {
    return {
      panZoomHandler: null,
      hideImg: false,
      isDragging: false,
      mouseX: 0,
      mouseY: 0
    };
  },
  props: {
    viewMode: String,
    url: String,
    colormap: Array,
    zoomToggle: Boolean,
    zoomCoordinates: Object,
    panCoordinatesMask: Object
  },
  watch: {
    viewMode: function() {
      this.panZoomHandler.zoomAbs(0, 0, 1);
    },
    colormap: function() {
      this.hideImg = true;
      this.changeColorMap();
    },
    url: function() {
      this.hideImg = true;
      this.changeColorMap();
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
    panCoordinatesMask: function(coordinates) {
      const { dx, dy } = coordinates;
      this.panZoomHandler.moveBy(dx, dy);
    }
  },
  computed: {
    ...mapGetters(["selectedAnalytic", "maskUrl", "maskOpacity", "baseUri"]),
    ...mapState({ zoomState: state => state.layout.zoomState }),
    isVertical: function() {
      return this.viewMode == "vertical";
    },
    isHorizontal: function() {
      return this.viewMode == "horizontal";
    },
    isOverlay: function() {
      return this.viewMode == "overlay";
    },
    opacity: function() {
      return { opacity: this.maskOpacity };
    },
    maskStyle: function() {
      let style = {
        visibility: this.hideImg ? "hidden" : "visible"
      };
      if (this.viewMode === "overlay") {
        style["mix-blend-mode"] = "normal";
      }
      return style;
    }
  },
  methods: {
    ...mapMutations(["calculateZoomState"]),
    startDrag() {
      this.isDragging = true;
    },
    drag() {
      if (!this.isDragging) return;
    },
    stopDrag() {
      this.isDragging = false;
    },
    changeColorMap() {
      // get references
      var colormap = this.colormap;

      // move img src to canvas for coloring
      const cvs = this.$refs.canvas;
      // final result goes here when complete
      var overlay = this.$refs.zoomContainer;
      // load new mask here. onload allows it to load fully before coloring
      const img = this.$refs.hiddenImg;
      var vm = this;

      // wait for img.src to load
      img.onload = () => {
        if (
          vm.colormap === cGradients.greyscale ||
          vm.selectedAnalytic == "groundtruth"
        ) {
          while (overlay == null) {
            overlay = this.$refs.zoomContainer;
          }
          overlay.src = vm.url;
          vm.hideImg = false;
          return;
        }

        // setup canvas context
        cvs.width = img.width;
        cvs.height = img.height;
        var ctx = cvs.getContext("2d");
        ctx.drawImage(img, 0, 0, cvs.width, cvs.height);
        var idt = ctx.getImageData(0, 0, cvs.width, cvs.height);

        // manipulate data
        var d = idt.data;
        for (var i = 0; i < d.length; i += 4) {
          // just need one of r,g,b since they are already greyscale
          let r = d[i];
          let lum = r / 255;

          // color r g b a based on linear interp of color gradient
          let col = cGradients.interpolateGradient(colormap, lum);
          d[i] = col[0];
          d[i + 1] = col[1];
          d[i + 2] = col[2];
          d[i + 3] = 255;
        }
        // save canvas data to overlay
        ctx.putImageData(idt, 0, 0);

        // sometimes this misbehaves and needs to be fetched
        while (overlay == null) {
          overlay = this.$refs.overlay;
        }

        overlay.src = cvs.toDataURL();
        vm.hideImg = false;
      };

      // setup a new image
      img.src = this.url;
    }
  },
  mounted() {
    /*
     * Colormap must be changed on mount to load Spectral
     */
    this.changeColorMap();
    /*
     * 'beforeWheel' registers the position of the mouse on wheel event
     * Pass the pan coordinates to ProbeView
     * Both images will zoom to same position
     *
     * return true turns off the wheel event and allows us to handle it ourselves
     */
    this.panZoomHandler = panzoom(this.$refs.zoomContainer, {
      minZoom: 1,
      maxZoom: 5,
      bounds: true,
      boundsPadding: 1,
      zoomDoubleClickSpeed: 1,
      smoothScroll: false,
      beforeWheel: e => {
        this.calculateZoomState(e);
        this.$emit("update:zoomCoordinates", { x: e.offsetX, y: e.offsetY });
        return true;
      }
    });

    /* Zoom the mask to wherever the probe is zoomed */
    this.panZoomHandler.zoomAbs(
      this.zoomCoordinates.x,
      this.zoomCoordinates.y,
      this.zoomState / 100
    );
    /*
     * When the mouse is dragging emit the coordinates to ProbeView
     */
    this.panZoomHandler.on("pan", e => {
      const mouseDelta = e.getMouseMovement();
      if (this.isDragging) {
        this.$emit("update:panCoordinatesMask", {
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
  z-index: 100000;
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

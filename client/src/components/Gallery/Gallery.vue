/* eslint-disable vue/valid-v-on */
<template>
  <div ref="Gallery" id="gallery">
    <section v-if="galleryMode === 'grid'">
      <GalleryImage
        v-for="i in probes"
        :key="i.id"
        :gridHeight="gridHeight"
        :probe="i"
      />
    </section>
    <section v-else>
      <ContentCard v-for="i in probes" :key="i.id" :probe="i" />
    </section>
  </div>
</template>

<script>
import { mapState, mapMutations, mapActions } from "vuex";

import GalleryImage from "./GalleryImage.vue";
import ContentCard from "./ContentCard.vue";

export default {
  name: "Gallery",
  components: {
    GalleryImage,
    ContentCard
  },

  data: function() {
    return {
      imgArr: []
    };
  },

  props: { galleryMode: { type: String, required: true } },

  methods: {
    ...mapActions(["getProbes"]),
    ...mapMutations(["setLoading"]),
    handleScroll() {
      let bottomOfWindow =
        this.$refs.Gallery.scrollTop + this.$refs.Gallery.offsetHeight + 100 >=
        this.$refs.Gallery.scrollHeight;

      if (bottomOfWindow) {
        this.nextPage();
      }
    },
    nextPage() {
      if (this.pageToken === "") return;
      this.getProbes(false);
    },

    changeGalleryMode() {}
  },

  computed: {
    ...mapState({
      analyticList: state => state.pipeline.analyticList,
      pageToken: state => state.layout.pageToken,
      probes: state => state.pipeline.probes
    }),

    gridHeight: function() {
      if (this.$store.getters.probe !== null) return 100;
      return 150;
    }
  },

  mounted() {
    this.$refs.Gallery.addEventListener("scroll", this.handleScroll);

    // pause and check if we need to load more once images render.
    /** Explanation: if we run this on say, a double-wide monitor and 50 probes
     * load but dont reach the bottom of the screen then the scroll even wont trigger
     * to load more images. we need to reach the bottom of the screen if we can  */
    var _v = this;
    var interval = setInterval(() => {
      if (!_v.$store.getters.isLoading && _v.$refs.Gallery !== undefined) {
        let bottomOfWindow =
          _v.$refs.Gallery.scrollTop + _v.$refs.Gallery.offsetHeight ===
          _v.$refs.Gallery.scrollHeight;

        if (bottomOfWindow) {
          _v.nextPage();
        } else {
          clearInterval(interval);
        }
      }
    }, 1000);
  },

  beforeDestroy() {
    this.$refs.Gallery.removeEventListener("scroll", this.handleScroll);
  }
};
</script>

<style lang="scss" scoped>
#gallery {
  overflow-y: auto;

  height: 100%;
  max-height: 100%;
}
section {
  display: flex;
  flex-wrap: wrap;
  margin-bottom: 50px;
  height: auto;
  pointer-events: all;
}
section::after {
  content: "";
  flex-grow: 999999999;
}

.center-message {
  width: 100%;
  height: 100%;
  line-height: 100%;
  vertical-align: middle;
  text-align: center;
}
</style>

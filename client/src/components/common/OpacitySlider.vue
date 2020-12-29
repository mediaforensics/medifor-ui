<template>
  <div>
    <label for="opacity" v-if="showLabel">Opacity</label>
    <input
      type="range"
      name="opacity"
      min="0"
      max="1"
      step="0.05"
      @change="setOpacity(localOpacity)"
      v-model="localOpacity"
    />
  </div>
</template>

<script>
import { mapMutations, mapState } from "vuex";

export default {
  name: "OpacitySlider",

  props: { showLabel: { default: false } },
  data() {
    return {
      localOpacity: this.opacity
    };
  },
  computed: {
    ...mapState({
      opacity: state => state.layout.maskOpacity
    })
  },

  methods: {
    ...mapMutations(["setOpacity"])
  }
};
</script>

<style scoped>
div {
  display: flex;
}
</style>

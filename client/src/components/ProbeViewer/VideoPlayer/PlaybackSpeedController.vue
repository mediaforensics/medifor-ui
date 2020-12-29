<template>
  <div class="dropdown is-up is-right" :class="{ 'is-active': menuIsActive }">
    <div class="dropdown-trigger">
      <button
        class="button"
        aria-haspopup="true"
        aria-controls="dropdown-menu7"
        @click="
          () => {
            this.menuIsActive = !this.menuIsActive;
          }
        "
      >
        <span><font-awesome-icon icon="cog"/></span>
      </button>
    </div>
    <div class="dropdown-menu" id="dropdown-menu7" role="menu">
      <div class="dropdown-content">
        <div class="dropdown-item">
          <p>
            Playback Speed
          </p>
          <hr class="dropdown-divider" />
        </div>
        <a
          @click="setSpeedCloseMenu(speed)"
          v-for="speed in availableSpeeds"
          :key="speed"
          class="dropdown-item"
        >
          {{ speed }}
        </a>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "PlaybackSpeedController",
  data: function() {
    return {
      availableSpeeds: [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2],
      menuIsActive: false
    };
  },
  methods: {
    setSpeedCloseMenu(speed) {
      this.menuIsActive = false;
      this.$emit("updatePlaybackSpeed", speed);
    }
  }
};
</script>
<style scoped>
p {
  font-weight: 600;
}
</style>

<template>
  <div class="border">
    <div class="progress" :style="calcProgress"></div>
    <div class="floatval">{{ curr }}/{{ max }}</div>
  </div>
</template>

<script>
export default {
  name: "ProgressBar",
  props: {
    curr: Number,
    max: Number
  },
  computed: {
    calcProgress: function() {
      return {
        width: (this.curr / this.max) * 100.0 + "%"
      };
    }
  }
};
</script>

<style scoped>
.border {
  width: 100%;
  border: 1px solid white;
  border-radius: 0;
  height: 8px;
  font-weight: 900;
  font-size: 1.5em;
}

.floatval {
  position: absolute;
  display: block;
  width: 100%;
  text-align: center;
}

.progress {
  background: lightgreen;
  height: 100%;
}
</style>

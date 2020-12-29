<template>
  <div
    class="full-bar"
    :disabled="expanded"
    :class="{ closed: !expanded, opened: expanded }"
    @click="close"
  ></div>
</template>

<script>
export default {
  name: "ToggleBar",
  props: {
    expanded: Boolean
  },
  methods: {
    close() {
      this.$store.commit("selectMenu", "");
    }
  }
};
</script>

<style lang="scss" scoped>
@import "~bulma/sass/utilities/_all";
.full-bar {
  display: inline-block;
  left: 100%;
  height: 100%;
  width: 12px;
  background: $grey-dark;
  transition: background-color 0.25s;
}
.full-bar:hover {
  background: $grey;
}
.closed:after {
  position: relative;
  left: 25%;
  top: 50%;
  border: 8px solid transparent;
  content: " ";
  display: inline-block;
  pointer-events: none;
  border-left-color: $grey;
}
.opened {
  width: 16px;
}
.opened:after {
  position: relative;
  left: -25%;
  top: 50%;
  border: 8px solid transparent;
  content: " ";
  display: inline-block;
  pointer-events: none;
  border-right-color: $grey;
}
</style>

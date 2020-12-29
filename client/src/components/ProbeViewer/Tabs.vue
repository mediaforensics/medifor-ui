<template>
  <div class="tabs is-fullwidth is-centered is-small is-toggle is-marginless">
    <ul v-for="tab in tabs" :key="tab">
      <li>
        <a :style="getStyle(tab)" @click="setTab(tab)">{{ tab }}</a>
      </li>
    </ul>
  </div>
</template>

<script>
export default {
  name: "Tabs",
  data: function() {
    return {
      selectedTab: "Detectors"
    };
  },
  computed: {
    tabs: function() {
      return ["Detectors", "Meta", "Labels"];
    }
  },
  methods: {
    getStyle(tab) {
      let style = {
        "border-radius": "4px 4px 0 0 ",
        "border-bottom": "3px solid #ccc",
        "background-color": tab == this.selectedTab ? "#ccc" : "white"
      };
      return style;
    },
    setTab(value) {
      this.selectedTab = value;
      this.$emit("changeTab", value);
    }
  }
};
</script>

<style scoped></style>

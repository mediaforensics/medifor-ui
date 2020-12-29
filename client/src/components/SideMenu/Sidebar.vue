<template>
  <div class="full-side dark">
    <div
      v-if="(enableGroups && username && groups.length > 0) || !enableGroups"
      class="static-side"
    >
      <SidebarIcon iconTitle="Upload" iconType="upload" :expands="false" />
      <SidebarIcon iconTitle="Import" iconType="cloud-upload-alt" />
      <SidebarIcon iconTitle="Filters" iconType="filter" :expands="true" />
    </div>
    <div class="expanding-side" :class="expandedClass">
      <!-- Individual expandable Components here-->
      <keep-alive>
        <component :is="selectedMenu" v-bind="menuProps"></component>
      </keep-alive>
    </div>
  </div>
</template>

<script>
import { mapState } from "vuex";

import SidebarIcon from "./SidebarIcon.vue";

import Filters from "./SidebarFilters.vue";

export default {
  name: "Sidebar",
  data: function() {
    return {};
  },
  components: {
    Filters,
    SidebarIcon
  },
  methods: {},
  computed: {
    ...mapState({
      selectedMenu: state => {
        const selectedMenu = state.layout.selectedMenu;
        const validMenus = ["Filters", "Download"];

        if (validMenus.includes(selectedMenu)) {
          return selectedMenu;
        }
      },
      username: state => state.user.name,
      groups: state => state.user.groups,
      enableGroups: state => state.config.enableGroups,
      menuProps: state => {
        if (state.layout.selectedMenu === "Filters") {
          return { initialFusionModel: state.pipeline.defaultFusionModel };
        }
      }
    }),

    expanded: function() {
      return (
        this.$store.getters["selectedMenu"] === "Filters" ||
        this.$store.getters["selectedMenu"] === "Settings" ||
        this.$store.getters["selectedMenu"] === "Download"
      );
    },
    expandedClass: function() {
      return {
        active: this.expanded
      };
    }
  },
  mounted() {}
};
</script>

<style scoped lang="scss">
.full-side {
  position: relative;
  height: 100%;
  width: auto;
  overflow: hidden;
}
.static-side {
  height: 100%;
  width: 4em;
  padding-right: 6px;
  float: left;
  border-right: 1px solid #444;
}
.expanding-side {
  float: left;
  height: 100%;
  visibility: collapse;
  width: 0px;
  transition: visibility 200ms, width 200ms;
  transition: padding none;
}
.expanding-side.active {
  width: 280px;

  visibility: visible;
}
</style>

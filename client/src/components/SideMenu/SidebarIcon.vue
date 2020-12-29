<template>
  <div
    class="icon-box"
    :title="tooltip"
    :class="{
      expandable: expands,
      active: $store.getters['selectedMenu'] === iconTitle
    }"
    @click="select"
  >
    <font-awesome-icon :icon="iconType" class="big-icon" />
    <p>{{ iconTitle }}</p>
  </div>
</template>

<script>
import { mapState, mapMutations, mapGetters } from "vuex";
export default {
  name: "SidebarIcon",
  props: {
    iconType: String,
    iconTitle: String,
    expands: Boolean
  },
  computed: {
    ...mapState({
      probe: state => state.pipeline.probe,
      selectedMenu: state => state.layout.selectedMenu,
      importModalView: state => state.layout.importModalView
    }),
    ...mapGetters(["queryParameters"]),
    /* If we are at the upload menu we need to return to the previous state, this can be
     * toggled by clicking the upload button again */
    returnToPreviousRoute: function() {
      const { name } = this.$route;
      const currentIcon =
        this.iconTitle == "Upload" || this.iconTitle == "Filters";

      return name == "upload" && currentIcon;
    },
    tooltip: function() {
      return this.iconTitle == "Upload"
        ? "Toggle Upload Screen"
        : this.iconTitle == "Import"
        ? "Toggle Import Modal"
        : "Toggle Filters";
    }
  },
  methods: {
    ...mapMutations(["selectMenu", "setImportModalView"]),
    select() {
      if (this.iconTitle == "Import") {
        this.setImportModalView(!this.importModalView);
        return;
      }
      if (this.returnToPreviousRoute) {
        if (this.probe)
          this.$router.push({
            name: "probe",
            params: { id: this.probe.id },
            query: this.queryParameters
          });
        else
          this.$router.push({
            name: "gallery",
            query: this.queryParameters
          });
      } else if (this.iconTitle == "Upload")
        this.$router.push({ name: "upload" });

      this.selectMenu(this.iconTitle);
    }
  }
};
</script>

<style scoped lang="scss">
@import "~bulma/sass/utilities/_all";

.icon-box {
  position: relative;
  display: block;
  width: 100%;
  height: 4.5em;
  margin: 24px 0;
  color: $light;
  transition: 0.25s;
}
.icon-box:hover {
  color: $info;
}
.icon-box.active {
  color: $link !important;
}

.big-icon {
  display: block;
  font-size: 1.5em;
  margin: 0 auto;
}
p {
  font-size: 12px;
  margin-top: 12px;
  font-weight: bold;
  text-align: center;
  pointer-events: none;
}
.expandable {
  transition: 0.25s;
}
.expandable::after {
  left: 80%;
  top: 10%;
  border: 6px solid transparent;
  content: "";
  position: absolute;
  pointer-events: none;
  border-left-color: $light;
}
.expandable:hover:after {
  border-left-color: $info;
}
.expandable.active:hover:after {
  border-left-color: $link !important;
}
</style>

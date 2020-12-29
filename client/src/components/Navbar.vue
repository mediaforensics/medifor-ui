<template>
  <nav class="navbar is-info" role="navigation" aria-label="main navigation">
    <div class="navbar-brand">
      <a class="navbar-item" href="./">
        <strong>MediFor Console</strong>
      </a>
      <a class="navbar-item" target="blank" :href="usermanual">
        <font-awesome-icon icon="info-circle" />
      </a>
    </div>
    <div class="navbar-menu">
      <div class="navbar-end">
        <div
          v-if="groupsEnabled && allowGroupView && groups.length > 0"
          class="navbar-item has-dropdown is-hoverable"
        >
          <a class="navbar-link has-text-weight-bold">
            <span class="has-text-weight-medium"
              >Showing probes from &nbsp;</span
            >
            {{ selectedGroup }}
          </a>
          <div class="navbar-dropdown">
            <a
              v-for="group in groups"
              :key="group"
              @click="setGroupHandleRoute(group)"
              class="navbar-item"
              :class="{
                'has-text-weight-semibold': group === selectedGroup,
                'has-background-white-ter': group === selectedGroup
              }"
            >
              {{ group }}
            </a>
          </div>
        </div>
        <div class="navbar-item">
          <span v-if="displayName">{{ displayName }}</span>
        </div>
      </div>
    </div>
  </nav>
</template>

<script>
import { mapActions, mapState, mapGetters, mapMutations } from "vuex";
export default {
  name: "Navbar",

  computed: {
    ...mapState({
      name: state => state.user.name,
      groups: state => state.user.groups,
      displayName: state => state.user.displayName,
      selectedGroup: state => state.user.selectedGroup,
      groupsEnabled: state => state.config.enableGroups,
      filterLabels: state => state.pipeline.filterLabels,
      allowGroupView: state => state.layout.allowGroupView
    }),
    usermanual: function() {
      return `${this.baseUri}/userManual.pdf`;
    },
    ...mapGetters(["queryParameters", "baseUri"])
  },
  methods: {
    ...mapActions(["setPreferredGroup"]),
    ...mapMutations(["applyFilters", "unselectAll"]),
    /* Set the preferred group in the store then handle the route update */
    setGroupHandleRoute: function(group) {
      /* Filter out the currently selected user tags as they may not exist in new group */
      let newLabels = this.filterLabels.filter(
        label => !label.includes("=null")
      );

      /* Deselect current probe and return the gallery view */
      this.unselectAll();
      this.applyFilters(newLabels);
      this.setPreferredGroup(group);
      this.$router.push({ name: "gallery", query: this.queryParameters });
    }
  },
  mounted() {}
};
</script>

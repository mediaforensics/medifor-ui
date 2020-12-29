<template>
  <div class="collapsible" v-if="meta != undefined">
    <div class="header" @click="metaOpen = !metaOpen">
      <h1>Metadata</h1>
      <font-awesome-icon :icon="plusMinusMeta" />
    </div>
    <div class="content meta active">
      <MetaSubgroup
        v-for="title in Object.keys(unflattenMeta).sort()"
        :key="title"
        :header="title"
        :metaSubData="unflattenMeta[title]"
        :metaOpen="metaOpen"
      />
    </div>
  </div>
</template>

<script>
import { mapState } from "vuex";
import MetaSubgroup from "./MetaSubgroup.vue";
export default {
  name: "Metadata",
  components: {
    MetaSubgroup
  },
  data: function() {
    return {
      metaOpen: true
    };
  },
  computed: {
    ...mapState({
      meta: state => state.pipeline.probe && state.pipeline.probe.meta
    }),

    unflattenMeta: function() {
      var result = {};
      var data = Object.assign({}, this.meta);
      for (var i in data) {
        var keys = i.split(":");
        keys.reduce(function(r, e, j) {
          return (
            r[e] ||
            (r[e] = isNaN(Number(keys[j + 1]))
              ? keys.length - 1 == j
                ? data[i]
                : {}
              : [])
          );
        }, result);
      }
      return result;
    },

    plusMinusMeta: function() {
      return !this.metaOpen ? "plus-circle" : "minus-circle";
    }
  }
};
</script>

<style scoped lang="scss">
@import "~bulma/sass/utilities/_all";
.collapsible {
  flex-basis: 40px;
  flex-grow: 1;
  transition: 0.5s;
  overflow: hidden;
}

.header {
  height: 40px;
  background: $info;
  color: white;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px;
  font-size: 1.05em;
  transition: 0.3s;
  border-bottom: 1px solid #ccc;
}

.header:hover {
  background: $link;
}

.header h1 {
  font-weight: 800;
}

.collapsible .content {
  max-height: 0;
  padding: 8px;
  overflow: hidden;
}

.content h4 {
  margin: 0;
}

.collapsible .content.active {
  max-height: 100%;
  overflow: auto;
}

.content.meta.active {
  display: block;
  background: white;
  padding: 3px;
  padding-bottom: 5px;
  overflow-x: hidden;
  overflow-y: scroll;
  max-height: 100%;
  border-radius: 0 0 5px 5px;
}
</style>

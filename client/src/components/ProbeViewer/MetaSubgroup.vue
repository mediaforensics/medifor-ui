<template>
  <div class="container">
    <div class="header" @click="subOpen = !subOpen">
      <div class="columns">
        <h6 class="column">{{ header }}</h6>
        <span class="column is-narrow"
          ><font-awesome-icon icon="caret-down"
        /></span>
      </div>
    </div>

    <div
      class="columns"
      v-for="(key, value) in Object.keys(metaSubData).sort()"
      :key="key"
      :value="value"
      :class="{ hidden: !subOpen }"
    >
      <div class="column" :title="key">{{ key }}</div>
      <div class="column" :title="metaSubData[key]" v-if="key === 'md5'">
        <a
          :href="'https://medifor.rankone.io/md5_info/' + meta['Hash:md5']"
          target="_blank"
        >
          {{ metaSubData[key] }}
        </a>
      </div>
      <div v-else class="column" :title="metaSubData[key]">
        {{ metaSubData[key] }}
      </div>
    </div>
  </div>
</template>

<script>
import { mapState } from "vuex";
export default {
  name: "MetaSubgroup",
  data: function() {
    return {
      subOpen: true
    };
  },
  props: {
    metaSubData: Object,
    header: String,
    metaOpen: Boolean
  },
  computed: {
    ...mapState({
      meta: state => state.pipeline.probe && state.pipeline.probe.meta
    })
  },
  // MetaOpen passed in from parent component
  // Triggers whether all child components should collapse or expand
  // Watcher looks for change and updates this component's visibilty with 'subOpen'
  watch: {
    metaOpen: function(value) {
      this.subOpen = value;
    }
  }
};
</script>

<style scoped lang="scss">
@import "~bulma/sass/utilities/_all";
div.header .columns {
  width: 100%;
}

div.header .columns .column {
  margin-top: 0px;
  padding-left: 5px;
}

div.header {
  border-bottom: 1px solid #a9a9a9;
}

.container div.header {
  height: 35px;
  background: $light;
  color: $grey;
  font-weight: 600 !important;
}

.container div.header:hover {
  background: #f0f0f0;
  color: $grey-dark;
}

h6.column {
  margin: 0;
}

.float-icon {
  position: relative;
  right: 6px;
  font-size: 16px;
}

div.columns {
  overflow-x: hidden;
  overflow-y: auto;
  visibility: visible;
  transition: 0.4s;
}

.columns.hidden {
  max-height: 0;
  visibility: hidden;
}

.column {
  padding: 4px;
  max-width: 100%;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
</style>

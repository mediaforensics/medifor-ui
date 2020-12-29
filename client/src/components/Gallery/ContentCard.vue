<template>
  <div class="card" @click="selectCurrentProbe">
    <router-link
      :to="{
        name: 'probe',
        params: { id: parsedProbe.id },
        query: this.queryParameters
      }"
    >
      <div class="card-top">
        <div class="columns">
          <div class="column is-narrow">
            <div class="img-container">
              <div class="frame">
                <img
                  :src="parsedProbe.thumbnail"
                  :alt="parsedProbe.id"
                  :title="parsedProbe.id"
                />
              </div>
            </div>
          </div>
          <div class="column">
            <div><b>Analytic Completion:</b> {{ getAnalytics }}</div>
            <div v-if="parsedProbe.hasFused">
              <b>Fusion Score:</b> {{ parsedProbe.galleryFusedScore }}
            </div>
            <div><b>File Name:</b> {{ parsedProbe.name }}</div>
            <div>
              <b>MD5:</b>
              <a
                :href="'https://medifor.rankone.io/md5_info/' + parsedProbe.md5"
                target="_blank"
              >
                {{ parsedProbe.id }}
              </a>
            </div>

            <!--<span>score or maybe X/Y analytics complete</span>-->
          </div>
        </div>
      </div>
    </router-link>
  </div>
</template>

<script>
/* parsedProbe is object returned from probeParser Mixin
it contains a variety of data on the currently selected probe */

import { mapActions, mapGetters } from "vuex";
import { probeParserMixin } from "../../mixins/probeParserMixin";
export default {
  name: "ContentCard",
  mixins: [probeParserMixin],
  data: function() {
    return {};
  },
  props: {
    probe: {}
  },
  methods: {
    ...mapActions(["selectProbe"]),
    //switches the currently selected probe
    selectCurrentProbe() {
      var payload = {};
      payload.probe = this.probe;
      this.selectProbe(payload);
    }
  },
  computed: {
    ...mapGetters(["queryParamets"]),
    getAnalytics: function() {
      return this.probe.analytics_finished + "/" + this.probe.analytics_total;
    }
  }
};
</script>

<style scoped>
.columns,
.column {
  padding: 4px;
  margin: 0;
}
.columns {
  width: 100%;
}
.card {
  width: 100%;
  padding: 6px;
  margin-bottom: 3px;
  border-radius: 0;
  white-space: normal;
  cursor: pointer;
}
.cutoff {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
h1 {
  font-size: 16px;
}
h3 {
  font-size: 14px;
}
.img-container {
  height: 100px;
  width: 100px;
  border: 1px solid #cccccc;
  white-space: nowrap;
  text-align: center;
}
.frame {
  display: inline-block;
  height: 100%;
  width: 100%;
  vertical-align: middle;
}
img {
  height: 100%;
  width: 100%;
  vertical-align: middle;
  object-fit: cover;
}
</style>

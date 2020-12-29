<template>
  <table class="status-wrapper">
    <!-- show score if they didn't optout -->
    <template v-if="status.completed">
      <tr>
        <th>Integrity</th>
        <th><IntegrityScore :score="integrity" format="integrity" /></th>
      </tr>
    </template>

    <template v-if="!status.completed">
      <!-- explain optout -->
      <tr v-if="status.optedOut">
        <th colspan="2">Opted out of producing score</th>
      </tr>

      <tr v-if="status.failed">
        <th colspan="2">Analytic failed</th>
      </tr>

      <tr v-if="status.queued">
        <th colspan="2">Waiting to be processed</th>
      </tr>
    </template>

    <template v-if="hasFacets">
      <br />
      <tr v-if="validSortedFacets.length > 0">
        Classification
      </tr>
      <tr v-for="facet in validSortedFacets" :key="facet[1]" class="facet">
        <td>
          {{ facet[0] }}
        </td>
        <td>
          <IntegrityScore :score="facet[1]" format="percent" />
        </td>
      </tr>
    </template>
  </table>
</template>

<script>
import { mapState } from "vuex";
import isempty from "lodash.isempty";
import IntegrityScore from "../../common/IntegrityScore";

export default {
  name: "Status",
  props: ["status", "manipulationFacets", "integrity"],
  components: { IntegrityScore },
  computed: {
    ...mapState({
      facetInfo: state => state.pipeline.facetInfo
    }),
    validSortedFacets: function() {
      //const facetInfo = this.facetInfo.facets;

      const facets = this.manipulationFacets;
      var sorted = [];
      for (var key in facets) {
        if (Object.prototype.hasOwnProperty.call(facets, key))
          sorted.push([key, facets[key]]);
      }
      sorted = sorted.sort((a, b) => {
        const f1 = a[1];
        const f2 = b[1];
        if (f1 >= f2) return -1;
        if (f2 > f1) return 1;
      });

      return sorted.filter(f => f[1] > 0.01);
    },
    hasFacets: function() {
      return !isempty(this.manipulationFacets);
    }
  }
};
</script>

<style scoped>
table {
  margin-block: 4px;
  box-sizing: border-box;
  min-width: 80%;
  font-size: 0.875rem;
}

th,
td {
  padding-block: 4px;
}

th {
  font-weight: 600;
}

tr.facet {
  border-top: dashed 1px #aaa;
}

tr:nth-of-type(2) {
  font-weight: 600;
}

tr:nth-of-type(3) {
  border-top-style: solid;
}
</style>

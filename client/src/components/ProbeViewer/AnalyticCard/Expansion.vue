<template>
  <ul class="expansion" :class="{ active: expansionData.isSelected }">
    <li
      v-if="hasExplanation"
      class="about"
      :class="{ 'new-section': hasValidTime }"
    >
      <strong>Explanation</strong>
      {{ expansionData.explanation }}
    </li>

    <li
      v-if="expansionData"
      class="about"
      :class="{ 'new-section': !hasExplanation }"
    >
      <strong>About this Analytic</strong>
      {{ expansionData.analyticDescription }}
    </li>

    <li v-if="hasValidTime">Analyzed in {{ expansionData.time }}</li>
  </ul>
</template>

<script>
import get from "lodash.get";

import { mapState } from "vuex";

export default {
  name: "Expansion",

  props: {
    expansionData: {}
  },
  data: function() {
    return {
      opacityVal: 0.6
    };
  },
  computed: {
    ...mapState({
      opacity: state => state.layout.maskOpacity
    }),

    hasValidTime() {
      const time = get(this, "expansionData.time");
      const status = get(this, "expansionData.status");
      return time !== "0ms" && !status.failed;
    },

    hasExplanation() {
      const explanation = get(this.expansionData, "explanation", false);
      return explanation && explanation.trim() !== "";
    }
  }
};
</script>

<style scoped>
ul {
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.4s ease-in-out;
}

ul.active {
  max-height: 500px;
}

li {
  margin-top: 4px;
}

.field {
  display: flex;
}

.about {
  padding-block-start: 0px;
}

strong {
  display: block;
  padding-block-start: 4px;
  font-size: 0.875rem;
  color: hsl(207, 12%, 53%);
}
</style>

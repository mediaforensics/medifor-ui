<template>
  <section
    class="panel-block supplemental_card is-size-7"
    :class="{ 'supplemental_card--selected': isSelected }"
    v-on:click="selectSupplemental()"
  >
    <span class="icon-container">
      <font-awesome-icon
        v-if="icon"
        :icon="icon[0]"
        :aria-label="icon[1]"
        class="icon has-text-info"
      />
    </span>

    <span v-if="data.notes !== ''">{{ data.notes }}</span>
    <span v-else>No Description Provided</span>
  </section>
</template>

<script>
export default {
  name: "SupplementalCard",
  data: function() {
    return {};
  },
  props: {
    data: {},
    current: String
  },
  computed: {
    isSelected: function() {
      return this.current == this.data.uri;
    },
    icon() {
      const dataType = this.data.type;

      return dataType.includes("image")
        ? ["image", "Data is an image"]
        : dataType.includes("json")
        ? ["stream", "Data is JSON"]
        : dataType.includes("video")
        ? ["video", "Data is a video"]
        : null;
    }
  },
  methods: {
    selectSupplemental() {
      this.$emit("clickedSupplemental", this.data.uri);
    }
  }
};
</script>

<style scoped lang="scss">
@import "~bulma/sass/utilities/_all";

section {
  vertical-align: bottom;
  line-height: 1;
}

.icon-container {
  display: inline-block;
  width: 1.6em;
}

.supplemental_card {
  background: #fff;
}

.supplemental_card--selected {
  background: #e8e8e8;
}

#type {
  font-size: 1rem;
  font-weight: 500;
}
</style>

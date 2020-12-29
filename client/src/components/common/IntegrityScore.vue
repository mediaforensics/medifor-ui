<template>
  <span>
    {{ formattedScore }}
  </span>
</template>

<script>
export default {
  props: {
    score: { type: Number },
    format: { type: String, default: "integrity" }
  },
  computed: {
    formattedScore() {
      if (this.score === undefined) {
        return "Not Calculated";
      }

      if (this.score === -1) return "Opted out of score";
      if (this.score < 0 || this.score > 1) return "Error score out of range";

      const format = this.format.toLowerCase();
      let result = "";

      result =
        format === "integrity"
          ? Math.floor((1 - this.score) * 100) + "%"
          : format === "percent"
          ? Math.floor(this.score * 100) + "%"
          : this.score;

      return result;
    }
  }
};
</script>

<style></style>

<template>
  <div>{{ text }}</div>
</template>

<script>
export default {
  name: "SidebarPrompt",
  props: {
    text: { type: String, required: true }
  }
};
</script>

<style scoped>
div {
  margin: 12px 0 3px 0;
  padding: 0;
  font-size: 0.9rem;
  font-weight: 600;
}
</style>

<template>
  <section>
    <Title>{{ title }}</Title>
    <div v-if="$slots.actions" class="actions">
      <slot name="actions"></slot>
    </div>
    <slot></slot>
  </section>
</template>

<script>
import Title from "./Title";
export default {
  name: "Container",
  components: { Title },
  props: ["title"]
};
</script>

<style scoped>
section {
  padding: 6px 12px;
  border-left: solid 1px hsl(0, 0%, 90%, 0.3);
  height: 100%;
  font-size: 1rem;
  overflow-y: auto;
  background-color: #555;
  color: #eee;
}
</style>

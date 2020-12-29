<template>
  <div><slot></slot></div>
</template>

<script>
export default {
  name: "SidebarTitle"
};
</script>

<style scoped>
div {
  margin-bottom: 12px;
  padding: 12px 0;
  border-bottom: solid 2px hsla(0, 100%, 100%, 0.6);
  font-size: 1rem;
  font-weight: 400;
}
</style>
